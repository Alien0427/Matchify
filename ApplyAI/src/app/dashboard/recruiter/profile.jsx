"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { UserCircle, Building2, Mail, Phone, BadgeCheck, Star } from 'lucide-react';

export default function RecruiterProfile() {
  const { recruiterId } = useAuth ? useAuth() : {};
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (recruiterId) {
      fetch(`http://localhost:8000/recruiter/profile?recruiterId=${recruiterId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setProfile(data.profile);
          else setError(data.error);
        });
    }
  }, [recruiterId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center">
      <div className="w-full rounded-2xl shadow-xl border border-accent/10 p-10 flex flex-col items-center bg-white/10 backdrop-blur-2xl relative overflow-hidden" style={{ boxShadow: '0 8px 32px 0 rgba(168,85,247,0.25), 0 1.5px 8px 0 rgba(0,0,0,0.15)' }}>
        {/* Glassmorphism accent glow */}
        <div className="absolute -inset-4 z-0 rounded-3xl bg-gradient-to-br from-purple-500/30 via-fuchsia-400/20 to-transparent blur-2xl opacity-70 pointer-events-none"></div>
        <div className="relative z-10 w-full flex flex-col items-center">
          <UserCircle className="w-24 h-24 text-accent mb-4 drop-shadow-lg" />
          <h2 className="text-3xl font-extrabold text-textPrimary mb-2">{profile?.fullName || 'Recruiter'}</h2>
          <div className="text-lg text-textSecondary font-medium mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" /> {profile?.companyName}
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <span className="font-semibold text-textPrimary">{profile.companyEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent" />
                <span className="font-semibold text-textPrimary">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-accent" />
                <span className="font-semibold text-textPrimary">{profile.verificationStatus}</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-accent" />
                <span className="font-semibold text-textPrimary">Pro: {profile.isPro ? 'Yes' : 'No'}</span>
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <span className="font-semibold text-textPrimary">Qualifications:</span>
                <span className="text-textSecondary">{profile.qualifications}</span>
              </div>
            </div>
          ) : (
            <div>Loading profile...</div>
          )}
          <button
            className="mt-4 bg-accent hover:bg-accentHover text-white font-semibold px-8 py-3 rounded-xl shadow-neon transition-all duration-300"
            onClick={() => router.push("/dashboard/recruiter")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 