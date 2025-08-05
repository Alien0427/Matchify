import * as mammoth from 'mammoth';
import * as Papa from 'papaparse';

/**
 * Main resume parsing function - simplified and more efficient
 * @param {File|Blob} file - The uploaded resume file
 * @returns {Promise<Object>} - Parsed resume data with text and keywords
 */
export async function parseResume(file) {
  try {
    // Extract text based on file type
    const rawText = await extractTextFromFile(file);
    
    // Get basic information and keywords
    const parsedData = {
      rawText: rawText,
      textLength: rawText.length,
      keywords: extractKeywords(rawText),
      basicInfo: extractBasicInfo(rawText)
    };
    
    console.log(`Text extracted length: ${parsedData.textLength}`);
    console.log(`Keywords found: ${parsedData.keywords.length}`);
    
    return parsedData;
    
  } catch (error) {
    console.error("Resume parsing error:", error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

/**
 * Extract text from different file types
 * @param {File|Blob} file - The uploaded file
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromFile(file) {
  // Handle different input types
  if (typeof file === 'string') {
    return file;
  }
  
  if (file instanceof Buffer) {
    return file.toString('utf-8');
  }
  
  // Get file type
  const fileName = file.name || '';
  const fileType = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
  
  // Convert to array buffer for processing
  const buffer = await file.arrayBuffer();
  
  switch (fileType) {
    case 'docx':
      return await extractFromDocx(buffer);
    case 'pdf':
      return extractFromPdf(buffer);
    case 'txt':
      return new TextDecoder().decode(buffer);
    case 'csv':
      return extractFromCsv(buffer);
    default:
      // Try to decode as text
      return new TextDecoder().decode(buffer);
  }
}

/**
 * Extract text from DOCX file
 * @param {ArrayBuffer} buffer - File buffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  } catch (error) {
    console.error("DOCX extraction error:", error);
    return "Error reading DOCX file. Please try a different format.";
  }
}

/**
 * Extract text from PDF file (simplified approach)
 * @param {ArrayBuffer} buffer - File buffer
 * @returns {string} - Extracted text
 */
function extractFromPdf(buffer) {
  // Basic PDF text extraction - in production, use a proper PDF library
  try {
    const text = new TextDecoder().decode(buffer);
    // Look for readable text patterns in PDF
    const textMatches = text.match(/[A-Za-z\s]{10,}/g);
    return textMatches ? textMatches.join(' ') : "PDF text extraction requires additional setup.";
  } catch (error) {
    return "Error reading PDF file. Please try converting to DOCX or TXT.";
  }
}

/**
 * Extract text from CSV file
 * @param {ArrayBuffer} buffer - File buffer
 * @returns {string} - Extracted text
 */
function extractFromCsv(buffer) {
  try {
    const text = new TextDecoder().decode(buffer);
    const results = Papa.parse(text, { 
      header: false,
      skipEmptyLines: true 
    });
    
    return results.data
      .map(row => row.filter(cell => cell && cell.trim()).join(' '))
      .filter(line => line.trim())
      .join('\n');
  } catch (error) {
    console.error("CSV extraction error:", error);
    return "Error reading CSV file.";
  }
}

/**
 * Extract keywords from resume text - simplified and more effective
 * @param {string} text - Resume text
 * @returns {Array} - List of relevant keywords
 */
export function extractKeywords(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const lowerText = text.toLowerCase();
  
  // Define skill categories for better matching
  const skillCategories = {
    programming: [
      'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
      'typescript', 'go', 'rust', 'scala', 'perl', 'r', 'matlab'
    ],
    frameworks: [
      'react', 'angular', 'vue', 'nodejs', 'express', 'django', 'flask', 'spring',
      'laravel', 'rails', 'nextjs', 'nuxt', 'svelte'
    ],
    databases: [
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 
      'oracle', 'sqlite', 'cassandra', 'dynamodb'
    ],
    cloud: [
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
      'git', 'github', 'gitlab', 'ci/cd', 'devops'
    ],
    tools: [
      'figma', 'sketch', 'photoshop', 'illustrator', 'jira', 'confluence',
      'slack', 'teams', 'notion', 'trello'
    ],
    soft_skills: [
      'leadership', 'communication', 'teamwork', 'problem solving', 'project management',
      'agile', 'scrum', 'analytical', 'creative', 'adaptable'
    ]
  };
  
  // Collect all found keywords
  const foundKeywords = [];
  
  // Check each category
  Object.values(skillCategories).flat().forEach(skill => {
    if (lowerText.includes(skill)) {
      foundKeywords.push(skill);
    }
  });
  
  // Add experience-related keywords
  const experienceKeywords = extractExperienceKeywords(lowerText);
  foundKeywords.push(...experienceKeywords);
  
  // Remove duplicates and return
  return [...new Set(foundKeywords)];
}

/**
 * Extract experience and education related keywords
 * @param {string} text - Lowercase resume text
 * @returns {Array} - Experience keywords
 */
function extractExperienceKeywords(text) {
  const keywords = [];
  
  // Job titles
  const jobTitles = [
    'software engineer', 'developer', 'programmer', 'architect', 'manager',
    'analyst', 'consultant', 'designer', 'specialist', 'coordinator',
    'lead', 'senior', 'junior', 'intern', 'freelancer'
  ];
  
  jobTitles.forEach(title => {
    if (text.includes(title)) {
      keywords.push(title);
    }
  });
  
  // Industries
  const industries = [
    'fintech', 'healthcare', 'e-commerce', 'education', 'gaming',
    'startup', 'enterprise', 'saas', 'mobile', 'web'
  ];
  
  industries.forEach(industry => {
    if (text.includes(industry)) {
      keywords.push(industry);
    }
  });
  
  // Education levels
  const education = ['bachelor', 'master', 'phd', 'degree', 'certification'];
  education.forEach(edu => {
    if (text.includes(edu)) {
      keywords.push(edu);
    }
  });
  
  return keywords;
}

/**
 * Extract basic information from resume text
 * @param {string} text - Resume text
 * @returns {Object} - Basic information
 */
function extractBasicInfo(text) {
  // Extract email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const email = text.match(emailRegex)?.[0] || '';
  
  // Extract phone
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phone = text.match(phoneRegex)?.[0] || '';
  
  // Extract potential name (first non-email, non-phone line)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const name = lines.find(line => 
    !emailRegex.test(line) && 
    !phoneRegex.test(line) && 
    line.length > 2 && 
    line.length < 50
  ) || '';
  
  // Check for years of experience
  const experienceRegex = /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i;
  const experienceMatch = text.match(experienceRegex);
  const yearsOfExperience = experienceMatch ? parseInt(experienceMatch[1]) : 0;
  
  return {
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    yearsOfExperience,
    hasContact: !!(email || phone)
  };
}

/**
 * Format resume data for job matching API
 * @param {Object} parsedResume - Parsed resume data
 * @returns {string} - Formatted text for analysis
 */
export function formatForJobMatching(parsedResume) {
  const { rawText, keywords, basicInfo } = parsedResume;
  
  // Create a structured summary for better AI analysis
  let formattedText = rawText;
  
  if (keywords.length > 0) {
    formattedText += `\n\nExtracted Skills: ${keywords.join(', ')}`;
  }
  
  if (basicInfo.yearsOfExperience > 0) {
    formattedText += `\n\nYears of Experience: ${basicInfo.yearsOfExperience}`;
  }
  
  return formattedText;
}