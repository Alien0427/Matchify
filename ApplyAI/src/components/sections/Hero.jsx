"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

// Placeholder SVGs for top company logos
const companyLogos = [
  {
    name: "Google",
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#fff"/><text x="50%" y="55%" textAnchor="middle" fill="#4285F4" fontSize="18" fontWeight="bold" dy=".3em">G</text></svg>
    ),
  },
  {
    name: "Microsoft",
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="8" fill="#fff"/><g><rect x="6" y="6" width="12" height="12" fill="#F25022"/><rect x="22" y="6" width="12" height="12" fill="#7FBA00"/><rect x="6" y="22" width="12" height="12" fill="#00A4EF"/><rect x="22" y="22" width="12" height="12" fill="#FFB900"/></g></svg>
    ),
  },
  {
    name: "Amazon",
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#fff"/><text x="50%" y="55%" textAnchor="middle" fill="#FF9900" fontSize="18" fontWeight="bold" dy=".3em">a</text></svg>
    ),
  },
  {
    name: "Meta",
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#fff"/><text x="50%" y="55%" textAnchor="middle" fill="#1877F3" fontSize="18" fontWeight="bold" dy=".3em">M</text></svg>
    ),
  },
  {
    name: "Netflix",
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#fff"/><text x="50%" y="55%" textAnchor="middle" fill="#E50914" fontSize="18" fontWeight="bold" dy=".3em">N</text></svg>
    ),
  },
  {
    name: "OpenAI",
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#fff"/><text x="50%" y="55%" textAnchor="middle" fill="#10A37F" fontSize="16" fontWeight="bold" dy=".3em">AI</text></svg>
    ),
  },
];

export default function HeroSection() {
  // Layout constants
  const mascotSize = 320; // px
  const logoCount = companyLogos.length;
  const mascotCenter = { x: mascotSize / 2, y: mascotSize / 2 + 30 };
  const radius = mascotSize * 0.7; // px, arc radius
  // Arc from 300deg (bottom right) to 60deg (top right), clockwise
  const arcStart = 300;
  const arcEnd = 60;

  // Calculate logo positions in a right-side semi-arc
  const logoPositions = companyLogos.map((_, i) => {
    const angle = arcStart + ((arcEnd - arcStart + 360) % 360) * (i / (logoCount - 1));
    const rad = (angle * Math.PI) / 180;
    return {
      x: mascotCenter.x + radius * Math.cos(rad),
      y: mascotCenter.y + radius * Math.sin(rad),
    };
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1),transparent_50%)]"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Modernizing the <span className="text-transparent bg-gradient-to-r from-purple-400 via-purple-500 to-fuchsia-500 bg-clip-text drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">Job Search</span> Experience
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
          >
            Find your perfect job match with AI-powered recommendations and a seamless, modern experience designed for the future of work.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            {/* Mascot and Logos Container */}
            <div className="relative mx-auto flex flex-col items-center justify-center" style={{ width: mascotSize, height: mascotSize + 60 }}>
              {/* SVG overlay for dashed lines */}
              <svg
                width={mascotSize}
                height={mascotSize + 60}
                className="absolute left-0 top-0 pointer-events-none z-10"
                style={{ overflow: "visible" }}
              >
                {logoPositions.map((pos, i) => (
                  <motion.line
                    key={i}
                    x1={mascotCenter.x}
                    y1={mascotCenter.y}
                    x2={pos.x}
                    y2={pos.y}
                    stroke="#a259ff"
                    strokeWidth="2.5"
                    strokeDasharray="8 8"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.5 + i * 0.15, ease: "easeInOut" }}
                    style={{ filter: "drop-shadow(0 0 6px #a259ff88)" }}
                  />
                ))}
              </svg>
              {/* Logos in a right-side semi-arc */}
              {logoPositions.map((pos, i) => (
                <div
                  key={i}
                  className="absolute z-20 flex items-center justify-center rounded-full shadow-lg bg-background/80 backdrop-blur-md border border-accent/30 hover:scale-110 transition-transform duration-300 cursor-pointer"
                  style={{
                    left: pos.x - 20,
                    top: pos.y - 20,
                    width: 40,
                    height: 40,
                  }}
                  title={companyLogos[i].name}
        >
                  {companyLogos[i].svg}
                </div>
              ))}
              {/* Mascot Image with floating animation */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-30"
                style={{ width: mascotSize, height: mascotSize }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <div
                    className="absolute z-10"
                    style={{ left: '-60px', top: 20 }}
                  >
                    <Image
                      src="/hero-character.png"
                      alt="AI Mascot"
                      width={mascotSize}
                      height={mascotSize}
                      className="select-none pointer-events-auto drop-shadow-2xl"
                      draggable={false}
                    />
                  </div>
                  {/* Purple glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-accent/20 blur-3xl -z-10"></div>
                </div>
              </motion.div>
            </div>
      </motion.div>

          {/* Right side - CTA and Trust indicators */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex-1 text-center lg:text-right"
          >
            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="lg"
                className="px-8 py-4 text-lg font-bold rounded-full bg-accent hover:bg-accentHover text-textPrimary shadow-neon hover:shadow-neon-hover transition-all duration-300 transform hover:scale-105"
                href="#upload"
              >
                Get Started Now
      </Button>

              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg font-semibold rounded-full border-2 border-accent/30 text-textSecondary hover:text-accent hover:border-accent transition-all duration-300"
                href="#features"
              >
                Learn More
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="mt-16 flex flex-wrap justify-center items-center gap-8 text-textSecondary text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>AI-Powered Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Instant Results</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Secure & Private</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
