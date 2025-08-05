import Link from "next/link";
import { Github, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-background/90 border-t border-accent/20 py-8 mt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-10 gap-6">
        <div className="flex items-center gap-2 text-xl font-bold text-textPrimary">
          <span>© {new Date().getFullYear()} ApplyAI</span>
        </div>
        <div className="flex gap-6 text-textSecondary text-base">
          <Link href="#features" className="hover:text-accent transition-colors">Features</Link>
          <Link href="#how" className="hover:text-accent transition-colors">How It Works</Link>
          <Link href="#contact" className="hover:text-accent transition-colors">Contact</Link>
        </div>
        <div className="flex gap-4">
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
            <Github className="w-6 h-6" />
          </a>
          <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
            <Linkedin className="w-6 h-6" />
          </a>
          <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
            <Twitter className="w-6 h-6" />
          </a>
        </div>
      </div>
    </footer>
  );
}
