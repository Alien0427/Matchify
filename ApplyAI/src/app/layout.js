import './globals.css';
import { JobResultsProvider } from '../context/JobResultsContext';
import { AuthProvider } from '../context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <JobResultsProvider>
            <Header />
            <main role="main" tabIndex={-1}>{children}</main>
            <Footer />
          </JobResultsProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 