'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { GraduationCap, Loader2, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);

      // Determine the destination dynamically
      const { data: counselor } = await supabase.from('counselors').select('id').eq('email', email).maybeSingle();
      if (counselor) {
        router.push('/admin');
        return;
      }

      // Check query parameter redirection
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.push(redirect);
        return;
      }

      // Default Student routing
      const { data: leads } = await supabase.from('leads').select('id').eq('email', email).limit(1);
      const lead = leads && leads.length > 0 ? leads[0] : null;
      if (lead) {
        router.push('/dashboard');
      } else {
        router.push('/application');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#F9FAFB] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background neon glow spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-brand-primary/10 via-transparent to-transparent -z-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-brand-secondary/5 -z-10 blur-3xl pointer-events-none" />

      {/* Brand logo overlay */}
      <div className="flex items-center gap-3 mb-8 select-none">
        <div className="p-2.5 bg-brand-primary rounded-xl text-white shadow-xl shadow-brand-primary/20">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-xl text-brand-white tracking-tight leading-none font-heading">
            EFOS
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
            Console SaaS
          </span>
        </div>
      </div>

      {/* Main Login Form Container */}
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow border line overlay */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-2xl -z-10" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold font-heading text-brand-white">Welcome Back</h2>
            <p className="text-xs text-slate-450">Sign in to your admissions account.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-brand-danger/10 border border-brand-danger/25 rounded-xl text-xs font-semibold text-brand-danger flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. coordinator@efos.edu"
              className="px-4 py-3 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white placeholder:text-slate-655"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="••••••••"
              className="px-4 py-3 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white placeholder:text-slate-655"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-brand-primary/10 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Footer Navigation Link */}
          <div className="text-center text-xs font-semibold text-slate-450 mt-2">
            Don't have an account?{' '}
            <Link href="/signup" className="text-brand-primary hover:underline ml-1">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
