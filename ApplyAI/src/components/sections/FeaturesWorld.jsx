"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

const locations = [
  { 
    name: "San Francisco", 
    role: "Software Engineer", 
    company: "Tech Giants",
    x: "15%", 
    y: "35%",
    color: "bg-accent",
    pulse: "animate-pulse"
  },
  { 
    name: "Berlin", 
    role: "Data Scientist", 
    company: "AI Startups",
    x: "48%", 
    y: "32%",
    color: "bg-accentHover",
    pulse: "animate-pulse"
  },
  { 
    name: "Bangalore", 
    role: "Product Manager", 
    company: "FinTech",
    x: "65%", 
    y: "45%",
    color: "bg-accent",
    pulse: "animate-pulse"
  },
  { 
    name: "London", 
    role: "UX Designer", 
    company: "Creative Agencies",
    x: "45%", 
    y: "30%",
    color: "bg-accentHover",
    pulse: "animate-pulse"
  },
  { 
    name: "Tokyo", 
    role: "DevOps Engineer", 
    company: "Gaming Studios",
    x: "80%", 
    y: "38%",
    color: "bg-accent",
    pulse: "animate-pulse"
  },
  { 
    name: "Sydney", 
    role: "Frontend Developer", 
    company: "E-commerce",
    x: "75%", 
    y: "65%",
    color: "bg-accentHover",
    pulse: "animate-pulse"
  }
];

const stats = [
  { number: "6,000+", label: "Global Companies" },
  { number: "50+", label: "Countries" },
  { number: "2.5M+", label: "Jobs Matched" },
  { number: "98%", label: "Success Rate" }
];

export default function FeaturesWorld() {
  const [hoveredLocation, setHoveredLocation] = useState(null);

  return (
    <section id="features" className="relative py-32 bg-gradient-to-br from-background via-surface/50 to-background overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accentHover/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header Section */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-textPrimary mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Your Global{" "}
            <span className="text-accent bg-gradient-to-r from-accent via-accentHover to-accent bg-clip-text text-transparent animate-pulse">
              Job-Matching
            </span>{" "}
            Partner
          </motion.h2>
          
          <motion.p 
            className="text-xl md:text-2xl text-textSecondary max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Our AI-powered platform matches you with top roles across the globe, instantly. 
            From Silicon Valley to Berlin, find opportunities that fit your skills and aspirations.
          </motion.p>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {stats.map((stat, index) => (
          <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.8, duration: 0.5 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">{stat.number}</div>
              <div className="text-textSecondary text-sm md:text-base font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
          
          {/* Globe Section */}
          <motion.div 
            className="flex-1 relative order-2 lg:order-1"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="relative max-w-lg mx-auto">
              {/* Multiple glow layers */}
              <div className="absolute inset-0 bg-accent/10 blur-3xl rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-accentHover/5 blur-2xl rounded-full animate-pulse delay-500"></div>
              {/* Animated Globe Container */}
              <motion.div
                className="relative z-10"
                animate={{ rotate: 0 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                whileHover={{ scale: 1.05, rotate: 0 }}
              >
                <div className="relative">
                  <img
                    src="/globe.jpg"
                    alt="World Map"
                    width={600}
                    height={300}
                    className="w-full max-w-[500px] mx-auto rounded-xl shadow-lg object-cover animate-fadein"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Content Side */}
          <motion.div 
            className="flex-1 max-w-2xl order-1 lg:order-2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="space-y-6">
                <h3 className="text-3xl md:text-4xl font-bold text-textPrimary">
                  Global Opportunities at Your Fingertips
                </h3>
                <p className="text-lg text-textSecondary leading-relaxed">
                  Our advanced AI analyzes your skills, experience, and preferences to match you with the perfect opportunities worldwide. No more endless job searching.
                </p>
              </div>
              
              {/* Feature list */}
              <div className="space-y-4">
                {[
                  "🌍 Real-time global job matching",
                  "🤖 AI-powered skill analysis", 
                  "⚡ Instant application processing",
                  "🎯 Personalized recommendations"
                ].map((feature, index) => (
                  <motion.div
                    key={feature}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 1.2, duration: 0.5 }}
                  >
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span className="text-textSecondary font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.8 }}
              >
                <button className="bg-accent hover:bg-accentHover text-textPrimary font-bold px-8 py-4 rounded-full shadow-neon hover:shadow-neon-hover transition-all duration-300 transform hover:scale-105">
                  Start Your Global Journey
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
