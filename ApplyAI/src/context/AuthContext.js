'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [recruiterId, setRecruiterId] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        // Fetch user role and recruiterId from backend
        try {
          const res = await fetch(`http://localhost:8000/user-info?uid=${user.uid}`);
          const data = await res.json();
          if (data.success) {
            setRole(data.role);
            setRecruiterId(data.recruiterId || null);
          } else {
            setRole(null);
            setRecruiterId(null);
          }
        } catch {
          setRole(null);
          setRecruiterId(null);
        }
      } else {
        setRole(null);
        setRecruiterId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-redirect recruiter users to dashboard after sign-in
  useEffect(() => {
    // Only redirect if on signup or login page (not home)
    const protectedPaths = ['/auth/signup', '/auth/login'];
    console.log('[AuthContext redirect effect] user:', user, 'role:', role, 'recruiterId:', recruiterId, 'pathname:', pathname);
    if (
      user &&
      role === 'recruiter' &&
      recruiterId &&
      protectedPaths.includes(pathname)
    ) {
      router.replace('/dashboard/recruiter');
    }
    // Do NOT redirect if the path is anything else (like /, /#features, etc)
  }, [user, role, recruiterId, pathname]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, code: error.code, message: 'Sign-in popup was closed before completing sign in.' };
      } else {
        console.error(error);
        return { success: false, code: error.code, message: error.message };
      }
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, role, recruiterId, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 