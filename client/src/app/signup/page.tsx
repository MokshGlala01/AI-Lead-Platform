'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth';
import { School, Loader2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic Validations
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signUp(email, password);

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorMsg(err.message || 'Failed to create account. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#F9FAFB] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background neon glow spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-brand-secondary/15 via-transparent to-transparent -z-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-brand-primary/5 -z-10 blur-3xl pointer-events-none" />

      {/* Brand logo overlay */}
      <div className="flex items-center gap-3 mb-8 select-none">
        <div className="p-2.5 bg-brand-primary rounded-xl text-white shadow-xl shadow-brand-primary/20">
          <School className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-xl text-brand-white tracking-tight leading-none font-heading">
            CampusFlow
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
            Console SaaS
          </span>
        </div>
      </div>

      {/* Main Signup Form Container */}
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow border line overlay */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-2xl -z-10" />

        {success ? (
          <div className="flex flex-col items-center text-center gap-4 py-4 animate-fade-in">
            <div className="p-4 bg-brand-green/10 border border-brand-green/20 rounded-full text-brand-green">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold font-heading text-brand-white">Account Created!</h2>
            <p className="text-sm text-slate-400 max-w-xs">
              Check your inbox at <span className="font-semibold text-brand-white">{email}</span> for a confirmation email to verify your account.
            </p>
            <div className="w-full border-t border-slate-800/80 my-4" />
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline uppercase tracking-wider"
            >
              Go to Login Page <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold font-heading text-brand-white">Get Started</h2>
              <p className="text-xs text-slate-450">Create an admissions coordinator account.</p>
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
                placeholder="e.g. coordinator@campusflow.edu"
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

            {/* Confirm Password Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Footer Navigation Link */}
            <div className="text-center text-xs font-semibold text-slate-450 mt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-primary hover:underline ml-1">
                Log In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
