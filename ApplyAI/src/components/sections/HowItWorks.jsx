"use client";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";

const steps = [
  {
    step: "Step 1",
    title: "Upload Your Resume",
    desc: "Securely upload your resume. Your data is always kept private and confidential.",
    note: "We never store your resume.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto mb-4"><circle cx="28" cy="28" r="28" fill="#a78bfa"/><path d="M28 38V18" stroke="#fff" strokeWidth="3" strokeLinecap="round"/><path d="M22 24L28 18L34 24" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
    glow: "shadow-[0_0_32px_0_rgba(168,85,247,0.35)]",
    iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-500",
  },
  {
    step: "Step 2",
    title: "AI-Powered Analysis",
    desc: "Our advanced AI parses your skills, experience, and qualifications to understand your unique profile.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto mb-4"><circle cx="28" cy="28" r="28" fill="#38bdf8"/><rect x="18" y="18" width="20" height="20" rx="6" fill="#fff"/><rect x="24" y="24" width="8" height="8" rx="2" fill="#38bdf8"/></svg>
    ),
    glow: "shadow-[0_0_32px_0_rgba(56,189,248,0.35)]",
    iconBg: "bg-cyan-400",
  },
  {
    step: "Step 3",
    title: "Get Instant Matches",
    desc: "Receive a curated list of top job opportunities that perfectly align with your career goals.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" className="mx-auto mb-4"><circle cx="28" cy="28" r="28" fill="#34d399"/><path d="M28 18V34" stroke="#fff" strokeWidth="3" strokeLinecap="round"/><circle cx="28" cy="38" r="2" fill="#fff"/></svg>
    ),
    glow: "shadow-[0_0_32px_0_rgba(52,211,153,0.35)]",
    iconBg: "bg-green-400",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-32 bg-[#181c27] text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <motion.h2
          className="text-center text-4xl md:text-5xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          How It Works
        </motion.h2>
        <p className="text-center text-lg text-gray-300 mb-16">A simple, three-step process to connect you with your future.</p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-6 max-w-5xl mx-auto">
        {steps.map((s, idx) => (
            <div key={idx} className={`relative w-full md:w-96 bg-[#23273a] rounded-2xl p-8 ${s.glow} transition-all duration-300`}>
              {/* Step badge */}
              <div className="absolute left-6 top-6">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white">{s.step}</span>
              </div>
              {/* Icon */}
              <div className="flex justify-center items-center mb-4 mt-2">
                {s.icon}
              </div>
              {/* Title */}
              <h3 className="font-bold text-2xl mb-3 text-white text-center">{s.title}</h3>
              {/* Description */}
              <p className="text-gray-300 text-center mb-2">{s.desc}</p>
              {/* Note (only for first card) */}
              {s.note && <p className="text-xs text-gray-400 italic text-center mt-2">{s.note}</p>}
              {/* Arrow to next card */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute right-[-36px] top-1/2 -translate-y-1/2">
                  <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><path d="M8 16h16m0 0l-6-6m6 6l-6 6" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
