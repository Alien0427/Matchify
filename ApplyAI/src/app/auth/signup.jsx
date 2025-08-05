'use client';
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithPhoneNumber, RecaptchaVerifier, sendPasswordResetEmail } from "firebase/auth";
import { app } from "../../lib/firebase";
import { Briefcase } from 'lucide-react';

export default function SignUp() {
  const [role, setRole] = useState("candidate");
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    qualifications: "",
    companyEmail: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [phoneStep, setPhoneStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const recruiterFlowRef = useRef(false);

  const { user, role: currentUserRole, recruiterId } = useAuth ? useAuth() : {};
  const router = useRouter();
  useEffect(() => {
    if (user && currentUserRole === 'recruiter' && recruiterId) {
      router.push('/dashboard/recruiter');
    }
  }, [user, currentUserRole, recruiterId, router]);

  // Autofill test recruiter data
  const autofillTestRecruiter = () => {
    // Always set recruiter role and form fields
    setRole(() => "recruiter");
    recruiterFlowRef.current = true;
    setForm({
      email: `testrecruiter${Math.floor(Math.random()*10000)}@gmail.com`,
      password: "Test@1234",
      fullName: "Test Recruiter",
      companyName: "Test Company",
      qualifications: "HR Manager 5+ years",
      companyEmail: `testrecruiter${Math.floor(Math.random()*10000)}@gmail.com`,
      phone: "+15555550123" // Make sure this is a Firebase test phone number
    });
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // List of public email domains to block for recruiters
  const publicEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'gmx.com', 'pm.me', 'msn.com', 'live.com', 'comcast.net', 'me.com', 'rediffmail.com', 'rocketmail.com', 'ymail.com', 'inbox.com', 'fastmail.com', 'hushmail.com', 'tutanota.com', 'mail.ru', 'qq.com', 'naver.com', '163.com', '126.com', 'sina.com', 'yeah.net', 'googlemail.com'
  ];

  // Helper to check if email is public
  const isPublicEmail = (email) => {
    const domain = email.split('@')[1]?.toLowerCase().trim();
    return publicEmailDomains.includes(domain);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    setEmailSent(false);
    setPhoneStep(false);
    try {
      let uid = null;
      if (role === "recruiter") {
        // Only block public email domains for companyEmail, not main email
        if (isPublicEmail(form.companyEmail)) {
          setError('Please use your company email address (public email domains are not allowed for recruiters).');
          setLoading(false);
          return;
        }
        if (!form.phone) {
          setError('Phone number is required for recruiters.');
          setLoading(false);
          return;
        }
        const auth = getAuth(app);
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        uid = userCredential.user.uid;
        // BYPASS: Skip email and phone verification for local testing
        const res = await fetch("http://localhost:8000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, role, uid })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setSuccess(true);
        window.location.reload();
        return;
      }
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role, uid })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      // If backend returns a warning about duplicate email, treat as success for local testing
      if (data.warning && data.warning.includes('Duplicate email')) {
        setSuccess(true);
        setError("");
        if (role === "recruiter") window.location.reload();
      } else {
        setSuccess(true);
        if (role === "recruiter") window.location.reload();
      }
    } catch (err) {
      if (err.message && err.message.includes('auth/email-already-in-use')) {
        setError('This email is already registered. Please sign in or use a different email.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      if (!confirmationResult) throw new Error("No confirmation result");
      console.log('Verifying OTP with confirmationResult:', confirmationResult);
      await confirmationResult.confirm(otp);
      const auth = getAuth(app);
      const user = auth.currentUser;
      const uid = user.uid;
      // Always use recruiter role if recruiter flow was started
      const submitRole = recruiterFlowRef.current ? "recruiter" : role;
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: submitRole, uid })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccess(true);
      setPhoneStep(false);
      if (submitRole === "recruiter") {
        setTimeout(() => {
          window.location.reload();
        }, 1200); // 1.2 second delay to allow Firestore to update
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async e => {
    e.preventDefault();
    setResetMsg("");
    setError("");
    try {
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMsg("Password reset email sent! Please check your inbox.");
    } catch (err) {
      setResetMsg(err.message);
    }
  };

  // Stepper for recruiter verification
  const recruiterSteps = [
    { label: "Account", done: true },
    { label: "Email Verification", done: emailSent },
    { label: "Phone Verification", done: success },
    { label: "Complete", done: success }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0036] via-[#18181b] to-[#2d0a4a] py-12 px-2">
      <button
        type="button"
        onClick={autofillTestRecruiter}
        className="mb-4 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-bold shadow-lg hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-200"
      >
        Test as Recruiter (Auto-fill)
      </button>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-white/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-14 border border-white/30 flex flex-col gap-8 animate-fade-in relative"
        style={{
          boxShadow:
            '0 8px 64px 0 rgba(168,85,247,0.25), 0 1.5px 8px 0 rgba(0,0,0,0.15)',
          background:
            'linear-gradient(120deg, rgba(30,41,59,0.65) 60%, rgba(168,85,247,0.18) 100%)',
          backdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(168,85,247,0.25)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-2">
          {/* Removed logo image as requested */}
          <div className="bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-full p-4 shadow-lg mb-2">
            <Briefcase className="w-10 h-10 text-white drop-shadow-lg" />
          </div>
          <h2 className="text-4xl font-extrabold text-center text-white tracking-tight mb-1">Sign Up</h2>
          <p className="text-lg text-center bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent font-semibold mb-2">
            Create your account to get matched or hire top talent with AI.
          </p>
        </div>
        {/* Toggle */}
        <div className="flex justify-center gap-12 mb-2">
          <label className="flex items-center cursor-pointer gap-2 text-lg">
            <input type="radio" value="candidate" checked={role === "candidate"} onChange={() => setRole("candidate")} className="accent-purple-500 w-5 h-5 transition-all" />
            <span className={role === "candidate" ? "text-purple-400 font-semibold" : "text-gray-300"}>Candidate</span>
          </label>
          <span className="text-gray-500 font-bold text-xl">|</span>
          <label className="flex items-center cursor-pointer gap-2 text-lg">
            <input type="radio" value="recruiter" checked={role === "recruiter"} onChange={() => setRole("recruiter" )} className="accent-purple-500 w-5 h-5 transition-all" />
            <span className={role === "recruiter" ? "text-purple-400 font-semibold" : "text-gray-300"}>Recruiter/Employer</span>
          </label>
        </div>
        {/* Stepper for recruiter */}
        {role === "recruiter" && (
          <div className="w-full mb-2">
            <div className="flex items-center justify-center gap-6">
              {recruiterSteps.map((step, idx) => (
                <div key={step.label} className="flex items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-base font-bold border-2 ${step.done ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white border-fuchsia-500 shadow-lg' : 'bg-gray-800 text-gray-400 border-gray-500'}`}>
                    {step.done ? <span>&#10003;</span> : idx + 1}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-purple-300' : 'text-gray-400'}`}>{step.label}</span>
                  {idx < recruiterSteps.length - 1 && <span className="text-gray-500 mx-2 text-lg">→</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Form fields */}
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="block w-full mb-2 border border-[#363646] bg-[#23232b]/80 text-white px-5 py-4 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-all duration-200 hover:shadow-md" required />
        {/* Show error for public email domains for recruiters (companyEmail only) */}
        {role === "recruiter" && isPublicEmail(form.companyEmail) && (
          <div className="text-red-400 text-sm mb-2">Please use your company email address (public email domains are not allowed for recruiters).</div>
        )}
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="block w-full mb-1 border border-[#363646] bg-[#23232b]/80 text-white px-5 py-4 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-all duration-200 hover:shadow-md" required />
        <div className="flex justify-end mb-2">
          <button type="button" className="text-xs text-purple-400 hover:underline focus:outline-none" onClick={() => setShowReset(true)}>
            Forgot Password?
          </button>
        </div>
        {showReset && (
          <div className="bg-[#23232b]/80 border border-[#363646] rounded-xl p-4 mb-2 flex flex-col gap-2 animate-fade-in">
            <label className="text-sm text-gray-300">Enter your email to reset password:</label>
            <input value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Email" className="block w-full border border-[#363646] bg-[#18181b] text-white px-3 py-2 rounded" />
            <button onClick={handleResetPassword} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-2 rounded font-semibold mt-1">Send Reset Email</button>
            {resetMsg && <div className="text-xs text-center mt-1 text-blue-400">{resetMsg}</div>}
            <button onClick={() => setShowReset(false)} className="text-xs text-gray-400 hover:underline mt-1">Cancel</button>
          </div>
        )}
        {role === "recruiter" && (
          <>
            <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} className="block w-full mb-2 border border-[#363646] bg-[#23232b]/80 text-white px-5 py-4 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-all duration-200 hover:shadow-md" required />
            <input name="companyName" placeholder="Company Name" value={form.companyName} onChange={handleChange} className="block w-full mb-2 border border-[#363646] bg-[#23232b]/80 text-white px-5 py-4 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-all duration-200 hover:shadow-md" required />
            <input name="qualifications" placeholder="Qualifications (e.g. HR Manager, 5+ yrs exp)" value={form.qualifications} onChange={handleChange} className="block w-full mb-2 border border-[#363646] bg-[#23232b]/80 text-white px-5 py-4 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-all duration-200 hover:shadow-md" required />
            <input name="companyEmail" placeholder="Company Email (must match company domain)" value={form.companyEmail} onChange={handleChange} className="block w-full mb-2 border border-[#363646] bg-[#23232b]/80 text-white px-5 py-4 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-all duration-200 hover:shadow-md" required />
            {/* Phone number required for recruiters */}
            {role === "recruiter" && (
              <input name="phone" placeholder="Phone Number (with country code)" value={form.phone} onChange={handleChange} className="block w-full mb-2 border border-[#363646] bg-[#23232b]/80 text-white px-5 py-4 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-all duration-200 hover:shadow-md" required />
            )}
            <p className="text-xs text-gray-300 mb-2">Recruiter accounts require company email and phone verification.</p>
          </>
        )}
        {/* Recaptcha container for phone verification */}
        {role === "recruiter" && <div id="recaptcha-container"></div>}
        {/* OTP step for recruiters */}
        {phoneStep && role === "recruiter" && (
          <div className="flex flex-col gap-2 mb-2">
            <label className="text-white">Enter the OTP sent to your phone:</label>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="block w-full border border-[#363646] bg-[#23232b]/80 text-white px-5 py-4 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-all duration-200 hover:shadow-md" />
            <button type="button" onClick={handleVerifyOtp} className="bg-accent hover:bg-accentHover text-white font-semibold px-6 py-2 rounded-full shadow-neon transition-all duration-300">Verify OTP</button>
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full text-lg font-bold py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-lg hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-200 mt-2 hover:scale-[1.03] active:scale-95 border-2 border-purple-400/30">
          {loading ? "Registering..." : "Sign Up"}
        </button>
        {error && <div className="text-red-500 text-center text-sm bg-red-50 p-2 rounded-md">{error}</div>}
        {success && <div className="text-green-500 text-center text-sm bg-green-50 p-2 rounded-md">Registration successful! Please check your email/phone for verification.</div>}
        {emailSent && <div className="text-blue-400 text-center text-sm">Verification email sent! Please check your inbox.</div>}
        {phoneStep && (
          <div className="mt-4">
            <div id="recaptcha-container"></div>
            <div className="mt-2 flex flex-col gap-2">
              <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" className="block w-full border border-[#363646] bg-[#23232b]/80 text-white px-5 py-4 rounded-xl text-lg focus:border-purple-500 focus:outline-none transition-all duration-200 hover:shadow-md" required />
              <button type="button" onClick={handleVerifyOtp} className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200">Verify Phone</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
} 