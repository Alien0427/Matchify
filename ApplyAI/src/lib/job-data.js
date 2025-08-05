// lib/job-data.js
import { db, collection, getDocs } from './firebase-config';

export async function getJobData() {
  try {
    const jobsCol = collection(db, 'jobs');
    const snapshot = await getDocs(jobsCol);
    
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Extract position from either position field or raw text
        let position = data.position;
        if (!position && data.raw) {
          const firstLine = data.raw.split('\n')[0];
          position = firstLine.replace(/🎯|🔁|⸻/g, '').trim();
        }

        // Extract company from either company field or link
        let company = data.company;
        if (!company && data.link) {
          try {
            const url = new URL(data.link);
            company = url.hostname.replace('www.', '').split('.')[0];
            company = company.charAt(0).toUpperCase() + company.slice(1);
          } catch (e) {
            company = "Company Not Specified";
          }
        }

        return {
          id: doc.id,
          title: position || "Position Available",
          company: company || "Company Not Specified",
          location: data.location || "Remote",
          description: data.raw || "No description available",
          requirements: [],
          skills: extractSkillsFromText(data.raw || ''),
          employmentType: data.experience?.includes('Intern') ? 'Internship' : 'Full-time',
          salary: data.salary || null,
          link: data.link || null
        };
      });
    } else {
      console.log('No jobs found in Firestore');
      return getFallbackJobData();
    }
  } catch (error) {
    console.error('Error fetching jobs from Firestore:', error);
    return getFallbackJobData();
  }
}

// Helper function to extract skills from raw text
function extractSkillsFromText(text) {
  const skillKeywords = [
    'React', 'JavaScript', 'Python', 'Java', 'Data Science',
    'AI', 'Machine Learning', 'Node.js', 'Software Engineer'
  ];
  
  return skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

// Fallback data remains the same
function getFallbackJobData() {
  return [
    {
      id: 'job1',
      title: 'Senior React Developer',
      company: 'Tech Innovations Inc.',
      location: 'Remote',
      description: 'Looking for an experienced React developer to lead our frontend team.',
      requirements: ['5+ years React', 'JavaScript expertise', 'Team leadership'],
      skills: ['React', 'JavaScript', 'Redux', 'CSS'],
      employmentType: 'Full-time'
    }
  ];
}