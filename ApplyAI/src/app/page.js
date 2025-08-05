export const metadata = {
  title: 'ApplyAI | Find Your Best Job Matches',
  description: 'Upload your resume and get matched to jobs that fit your skills and experience. Powered by AI.',
  openGraph: {
    title: 'ApplyAI | Find Your Best Job Matches',
    description: 'Upload your resume and get matched to jobs that fit your skills and experience. Powered by AI.',
    url: 'https://yourdomain.com/',
    siteName: 'ApplyAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApplyAI | Find Your Best Job Matches',
    description: 'Upload your resume and get matched to jobs that fit your skills and experience. Powered by AI.',
  },
};

import HeroSection from '@/components/sections/Hero';
import FeaturesWorld from '@/components/sections/FeaturesWorld';
import HowItWorks from '@/components/sections/HowItWorks';
import ResumeUploadPanel from '@/components/sections/ResumeUploadPanel';

export default function HomePage() {
  return (
    <main className="bg-background min-h-screen">
      <HeroSection />
      <FeaturesWorld />
      <HowItWorks />
      <ResumeUploadPanel />
    </main>
  );
}