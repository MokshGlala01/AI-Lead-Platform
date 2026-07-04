'use client';

// Reusable lead form styled for luxury dark themed dashboard modals and student portal submissions
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface LeadFormProps {
  onSubmitSuccess?: (lead: any) => void;
  isModal?: boolean;
  onCancel?: () => void;
  prefilledEmail?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmitSuccess, isModal = false, onCancel, prefilledEmail }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: prefilledEmail || '',
    phone: '',
    city: '',
    age: '',
    course_interest: 'BTech',
    qualification: '12th Completed',
    downloaded_brochure: false,
    website_visits: 1
  });

  React.useEffect(() => {
    if (prefilledEmail) {
      setFormData((prev) => ({ ...prev, email: prefilledEmail }));
    }
  }, [prefilledEmail]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const courses = ['BTech', 'MBA', 'BCA', 'MCA', 'Diploma', 'BBA'];
  const qualifications = ['10th', '12th Appearing', '12th Completed', 'Graduate', 'Post Graduate'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: val
    }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Name is required.');
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Phone number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const response = await axios.post(`${apiUrl}/api/leads`, {
        ...formData,
        phone: cleanPhone
      });

      setSuccess(true);
      if (onSubmitSuccess) {
        setTimeout(() => {
          onSubmitSuccess(response.data);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      if (error.response?.status === 409) {
        setErrorMsg('This phone number is already registered.');
      } else {
        setErrorMsg(error.response?.data?.error || 'Failed to submit form. Please verify connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center gap-6 animate-fade-in select-none">
        <div className="p-4 bg-brand-green/10 border border-brand-green/20 rounded-full text-brand-green">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-brand-white">Application Recorded!</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            Thank you, <span className="font-semibold text-brand-white">{formData.name}</span>. An admissions counselor will auto-grade your enrollment probability shortly.
          </p>
        </div>
        
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-primary text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-brand-primary/25 hover:bg-brand-primary-light active:scale-[0.98] transition-all border border-brand-primary/15 cursor-pointer group"
        >
          Track My Application
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMsg && (
        <div className="p-3.5 bg-brand-danger/10 border border-brand-danger/25 rounded-xl text-xs font-semibold text-brand-danger flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Jane Doe"
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white placeholder:text-slate-650"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white placeholder:text-slate-655"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!!prefilledEmail}
            placeholder="e.g. jane@example.com"
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white placeholder:text-slate-655 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
            City
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g. Mumbai"
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white placeholder:text-slate-655"
          />
        </div>

        {/* Age */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
            Age
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="e.g. 18"
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white placeholder:text-slate-655"
          />
        </div>

        {/* Site visits simulation (only for counselor modal) */}
        {!isModal ? null : (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
              Website Visits
            </label>
            <input
              type="number"
              name="website_visits"
              min="1"
              value={formData.website_visits}
              onChange={handleChange}
              placeholder="e.g. 1"
              className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white placeholder:text-slate-655"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {/* Course Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
            Course Interest
          </label>
          <select
            name="course_interest"
            value={formData.course_interest}
            onChange={handleChange}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white"
          >
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        {/* Qualification Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
            Qualification
          </label>
          <select
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-sm rounded-xl focus:outline-none focus:border-brand-primary transition-all text-brand-white"
          >
            {qualifications.map((qual) => (
              <option key={qual} value={qual}>
                {qual}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Brochure check */}
      <div className="flex items-center gap-3.5 mt-2 select-none">
        <input
          type="checkbox"
          name="downloaded_brochure"
          id="downloaded_brochure"
          checked={formData.downloaded_brochure}
          onChange={handleChange}
          className="w-4.5 h-4.5 rounded border-slate-800 text-brand-primary focus:ring-brand-primary bg-slate-950"
        />
        <label htmlFor="downloaded_brochure" className="text-xs font-bold text-slate-400 cursor-pointer">
          I have downloaded the program details brochure
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-800/60 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4.5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold text-slate-300 rounded-xl transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-brand-primary/95 shadow-lg shadow-brand-primary/10 transition-all flex-1 sm:flex-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Enrollment Request'
          )}
        </button>
      </div>
    </form>
  );
};

export default LeadForm;
