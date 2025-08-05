// app/api/analyze/route.js
export const dynamic = 'force-dynamic';

import { Gemini } from '../../../lib/gemini';
import { parseResume, formatForJobMatching } from '../../../lib/resume-parser';
import { getJobData } from '../../../lib/job-data';

export async function POST(request) {
  console.log('\n--- Job Matching Analysis Started ---');
  
  try {
    // Parse the incoming request
    const { input, error } = await parseRequest(request);
    if (error) {
      return Response.json({ success: false, error }, { status: 400 });
    }

    // Process the resume
    const resumeData = await processResume(input);
    if (!resumeData) {
      return Response.json({ 
        success: false, 
        error: 'Unable to process resume. Please check file format.' 
      }, { status: 400 });
    }

    // Get job data
    const jobs = await getJobData();
    if (!jobs?.length) {
      return Response.json({ 
        success: false, 
        error: 'No job listings available at the moment.' 
      }, { status: 404 });
    }

    // Analyze job matches
    const analysis = await analyzeJobMatches(resumeData, jobs);
    
    console.log(`Analysis completed: ${analysis.length} job matches found`);
    
    return Response.json({
      success: true,
      recommendations: analysis,
      resumeInfo: {
        textLength: resumeData.textLength,
        keywordsFound: resumeData.keywords.length,
        hasContact: resumeData.basicInfo.hasContact
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json({
      success: false,
      error: 'Analysis failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    }, { status: 500 });
  }
}

/**
 * Parse the incoming request data
 * @param {Request} request - The HTTP request
 * @returns {Object} - Parsed input data or error
 */
async function parseRequest(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      return {
        input: {
          resume: formData.get('resume'),
          skills: formData.get('skills') || ''
        }
      };
    } else {
      const jsonData = await request.json();
      return { input: jsonData };
    }
  } catch (e) {
    return { error: 'Invalid request format' };
  }
}

/**
 * Process the resume file and extract relevant information
 * @param {Object} input - Input data containing resume and skills
 * @returns {Object|null} - Processed resume data
 */
async function processResume(input) {
  try {
    if (!input.resume && !input.skills) {
      throw new Error('No resume or skills provided');
    }

    let resumeData = null;

    // Process resume file if provided
    if (input.resume) {
      console.log('Processing resume file...');
      resumeData = await parseResume(input.resume);
      
      // Add manual skills to keywords if provided
      if (input.skills) {
        const manualSkills = input.skills
          .split(',')
          .map(skill => skill.trim().toLowerCase())
          .filter(skill => skill.length > 0);
        
        resumeData.keywords = [...new Set([...resumeData.keywords, ...manualSkills])];
      }
    } else if (input.skills) {
      // Only skills provided, create basic resume data
      const skillsText = input.skills;
      resumeData = {
        rawText: skillsText,
        textLength: skillsText.length,
        keywords: skillsText.split(',').map(s => s.trim().toLowerCase()),
        basicInfo: { hasContact: false, yearsOfExperience: 0 }
      };
    }

    return resumeData;
  } catch (error) {
    console.error('Resume processing error:', error);
    return null;
  }
}

/**
 * Analyze job matches using Gemini AI
 * @param {Object} resumeData - Processed resume data
 * @param {Array} jobs - Available job listings
 * @returns {Array} - Job match analysis
 */
async function analyzeJobMatches(resumeData, jobs) {
  try {
    const gemini = new Gemini();
    
    // Format resume data for AI analysis
    const formattedResumeText = formatForJobMatching(resumeData);
    
    console.log('Sending to Gemini for analysis...');
    console.log(`Resume keywords: ${resumeData.keywords.slice(0, 10).join(', ')}...`);
    console.log(`Jobs to analyze: ${jobs.length}`);
    
    // Call Gemini with structured data
    const analysis = await gemini.analyzeJobMatches(
      formattedResumeText, 
      jobs, 
      resumeData.keywords
    );
    
    // Enhance analysis with additional metadata
    return analysis.map(job => ({
      ...job,
      metadata: {
        keywordMatches: countKeywordMatches(resumeData.keywords, job),
        resumeLength: resumeData.textLength,
        analysisTimestamp: new Date().toISOString()
      }
    }));
    
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw new Error('Job matching analysis failed');
  }
}

/**
 * Count how many resume keywords match the job description
 * @param {Array} resumeKeywords - Keywords from resume
 * @param {Object} job - Job object
 * @returns {number} - Number of matching keywords
 */
function countKeywordMatches(resumeKeywords, job) {
  if (!job.description && !job.skills) return 0;
  
  const jobText = `${job.description || ''} ${(job.skills || []).join(' ')}`.toLowerCase();
  
  return resumeKeywords.filter(keyword => 
    jobText.includes(keyword.toLowerCase())
  ).length;
}