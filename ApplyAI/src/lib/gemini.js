// lib/gemini.js

export class Gemini {
  constructor() {
    this.apiKey = "AIzaSyDTxZEqKVDv44sXlbEpo42g6Spez-JE5qQ";
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  }

  async analyzeJobMatches(resumeText, jobs, keywords) {
    if (!this.apiKey) {
      console.error('API Error: Missing Gemini API key');
      throw new Error('API configuration error - check server logs');
    }

    const prompt = this.createAnalysisPrompt(resumeText, jobs, keywords);
    console.log('Prompt length (chars):', prompt.length);
    console.log('Keywords being analyzed:', keywords.slice(0, 10));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const apiUrl = `${this.baseUrl}?key=${this.apiKey}`;
      console.log('Making API request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3000
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH"
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Gemini API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API Success - Response received');

      let resultText = null;
      
      if (data.candidates && data.candidates[0]?.content?.parts?.length > 0) {
        resultText = data.candidates[0].content.parts[0].text;
      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`Content blocked by Gemini API: ${data.promptFeedback.blockReason}`);
      }

      if (!resultText) {
        console.error('Unexpected API response structure:', JSON.stringify(data));
        throw new Error('No response content from Gemini API');
      }

      return this.parseResponse(resultText, jobs);

    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.error('🕒 Gemini API request timed out.');
        throw new Error('Gemini API request timed out');
      }

      console.error('Gemini API Error:', error);
      // Return fallback analysis instead of throwing
      return this.fallbackMatching(jobs, keywords);
    }
  }

  createAnalysisPrompt(resumeText, jobs, keywords) {
    const trimmedResume = resumeText.slice(0, 6000);
    const jobsForAnalysis = jobs.slice(0, 8);
    
    return `
ROLE: You are an expert career advisor analyzing job matches for a candidate.

CANDIDATE PROFILE:
${trimmedResume}

CANDIDATE KEY SKILLS: ${keywords.join(', ')}

JOB LISTINGS TO ANALYZE:
${jobsForAnalysis.map((job, index) => `
JOB ${index + 1}:
- ID: ${job.id}
- Title: ${job.title || 'Not specified'}
- Company: ${job.company || 'Not specified'}
- Location: ${job.location || 'Not specified'}
- Skills Required: ${job.skills ? job.skills.join(', ') : 'Not specified'}
- Description: ${job.description ? job.description.substring(0, 400) : 'No description available'}
- Salary: ${job.salary || 'Not specified'}
`).join('\n')}

ANALYSIS REQUIREMENTS:
1. Calculate realistic match percentage (0-100%) based on:
   - Skills alignment (40% weight)
   - Experience level fit (30% weight)
   - Role relevance (20% weight)
   - Company/industry fit (10% weight)

2. Provide specific, actionable explanations
3. Identify both matching and missing skills
4. Give clear recommendations

RESPONSE FORMAT (JSON ONLY):
[
  {
    "id": "exact_job_id_from_above",
    "title": "job_title",
    "company": "company_name",
    "location": "location",
    "matchPercentage": 85,
    "whyMatch": "Detailed explanation focusing on skills alignment and why this role fits the candidate's background",
    "matchingSkills": ["skill1", "skill2", "skill3"],
    "missingSkills": ["skill4", "skill5"],
    "recommendation": "Strong match - Apply with confidence",
    "description": "Enhanced description explaining the match quality and what makes this opportunity attractive"
  }
]

IMPORTANT: 
- Use EXACT job IDs from the listings above
- Match percentages should be realistic (most jobs 50-85%)
- Focus on actual skills from the candidate's profile
- Provide encouraging but honest assessments

Return only valid JSON array, no other text.
`;
  }

  parseResponse(response, originalJobs) {
    try {
      console.log('Parsing Gemini response...');
      
      // Clean the response to extract JSON
      let cleanContent = response.trim();
      
      // Remove markdown code blocks
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON array boundaries
      const jsonStartIndex = cleanContent.indexOf('[');
      const jsonEndIndex = cleanContent.lastIndexOf(']');
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        cleanContent = cleanContent.substring(jsonStartIndex, jsonEndIndex + 1);
      }

      const parsedJobs = JSON.parse(cleanContent);
      console.log(`Successfully parsed ${parsedJobs.length} job analyses`);
      
      // Merge with original job data and ensure consistency
      return parsedJobs.map(analyzedJob => {
        const originalJob = originalJobs.find(job => job.id === analyzedJob.id);
        
        if (!originalJob) {
          console.warn(`Job ID ${analyzedJob.id} not found in original jobs`);
          return null;
        }

        // Ensure numeric match percentage
        let matchPercentage = analyzedJob.matchPercentage;
        if (typeof matchPercentage === 'string') {
          matchPercentage = parseInt(matchPercentage.replace('%', ''), 10);
        }
        if (isNaN(matchPercentage)) matchPercentage = 50;

        return {
          ...originalJob,
          matchPercentage: Math.min(Math.max(matchPercentage, 0), 100),
          whyMatch: analyzedJob.whyMatch || 'Good potential match based on your profile',
          matchingSkills: Array.isArray(analyzedJob.matchingSkills) ? analyzedJob.matchingSkills : [],
          missingSkills: Array.isArray(analyzedJob.missingSkills) ? analyzedJob.missingSkills : [],
          recommendation: analyzedJob.recommendation || 'Consider applying',
          description: analyzedJob.description || analyzedJob.whyMatch || originalJob.description || 'Interesting opportunity to explore'
        };
      }).filter(job => job !== null);

    } catch (error) {
      console.error('Response parsing error:', error);
      console.log('Raw response sample:', response.substring(0, 500));
      
      // Return fallback analysis
      console.log('Using fallback matching due to parsing error');
      return this.fallbackMatching(originalJobs, []);
    }
  }

  fallbackMatching(jobs, keywords) {
    console.log('Generating fallback job matches...');
    
    return jobs.slice(0, 6).map(job => {
      // Simple keyword-based matching
      const jobText = `${job.title || ''} ${job.description || ''} ${(job.skills || []).join(' ')}`.toLowerCase();
      
      const matchingSkills = keywords.filter(keyword => 
        jobText.includes(keyword.toLowerCase())
      );
      
      // Calculate match percentage
      const skillMatch = keywords.length > 0 ? (matchingSkills.length / keywords.length) * 60 : 30;
      const baseScore = 30; // Base score for any job
      const matchPercentage = Math.min(Math.round(baseScore + skillMatch), 95);
      
      // Generate appropriate messaging
      const getRecommendation = (score) => {
        if (score >= 75) return 'Strong match - Apply with confidence';
        if (score >= 60) return 'Good fit - Consider applying';
        if (score >= 45) return 'Potential match - Worth exploring';
        return 'Opportunity to learn and grow';
      };

      const getWhyMatch = (matchingSkills, job) => {
        if (matchingSkills.length > 0) {
          return `Good alignment with your skills in ${matchingSkills.slice(0, 3).join(', ')}. This ${job.title || 'position'} offers opportunities to apply your technical expertise and grow your career.`;
        }
        return `This ${job.title || 'role'} presents an excellent opportunity to expand your skill set and advance your career in a dynamic environment.`;
      };

      return {
        ...job,
        matchPercentage,
        whyMatch: getWhyMatch(matchingSkills, job),
        matchingSkills: matchingSkills.slice(0, 5),
        missingSkills: job.skills ? job.skills.slice(0, 3).filter(skill => 
          !matchingSkills.includes(skill.toLowerCase())
        ) : [],
        recommendation: getRecommendation(matchPercentage),
        description: job.description || `Exciting opportunity at ${job.company || 'a growing company'} to develop your skills and advance your career.`
      };
    });
  }
}