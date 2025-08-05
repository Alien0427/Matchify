"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from '../../context/AuthContext';
import { Briefcase } from 'lucide-react';

export default function Header() {
  const { user, role, recruiterId, signInWithGoogle, signOutUser } = useAuth();
  console.log('Header Auth:', { user, role, recruiterId });
  console.log('user:', user);
  console.log('role:', role);
  console.log('recruiterId:', recruiterId);
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg border-b border-accent/20 shadow-lg">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-10 py-4">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold text-textPrimary tracking-tight hover:text-accent transition-colors">
          <Briefcase className="w-8 h-8 text-accent" />
          <span>Apply<span className="text-accent">AI</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <Link href="/#features" className="text-textSecondary hover:text-accent transition-colors duration-200 font-medium text-lg">
            Features
          </Link>
          <Link href="/#how" className="text-textSecondary hover:text-accent transition-colors duration-200 font-medium text-lg">
            How It Works
          </Link>
          <Link href="/#contact" className="text-textSecondary hover:text-accent transition-colors duration-200 font-medium text-lg">
            Contact
          </Link>
          <Link href="/auth/signup" className="text-accent font-semibold hover:underline">
            For Recruiters
          </Link>
          {user && role === 'recruiter' && recruiterId && (
            <Link href="/dashboard/recruiter" className="text-accent font-semibold hover:underline">
              Dashboard
            </Link>
          )}
        </div>
        {/* Mobile: add For Recruiters link as well */}
        <div className="md:hidden flex items-center gap-4">
          <Link href="/auth/signup" className="text-accent font-semibold hover:underline">
            For Recruiters
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-textSecondary text-sm hidden md:inline">{
                user.displayName
                  ? user.displayName
                  : user.email
                    ? user.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : ''
              }</span>
              <Button
                onClick={signOutUser}
                className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-5 py-2 rounded-full shadow-md transition-all"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              onClick={signInWithGoogle}
              className="bg-accent hover:bg-accentHover text-white font-semibold px-6 py-2 rounded-full shadow-neon transition-all duration-300"
            >
              Sign In
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
