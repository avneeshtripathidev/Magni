"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useArtistAuth } from '../../../lib/auth/authContext';
import { ModalPortal } from '../../../components/shared/ModalPortal';
import { PerformerTermsModal } from '../../../components/shared/PerformerTermsModal';
import {
  Mic2,
  Lock,
  Mail,
  User,
  Phone,
  Loader2,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react';

export default function RegisterPage() {
  const { signUpWithEmail, signInWithGoogle, loginAsDemoArtist } = useArtistAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Track landing page visit & visitor IP
  useEffect(() => {
    try {
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/register',
          type: 'artist_register_visit',
          source:
            typeof document !== 'undefined' && document.referrer.includes('magnevents.in')
              ? 'magnevents_main_site_cta'
              : 'direct_register_visit',
        }),
      }).catch(() => {});
    } catch (e) {}
  }, []);

  // Password Quality Evaluation
  const passwordCriteria = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(password),
  };

  const strengthScore = [
    passwordCriteria.length,
    passwordCriteria.hasNumber,
    passwordCriteria.hasMixedCase,
    passwordCriteria.hasSpecial,
  ].filter(Boolean).length;

  // Step A: Validate & open confirmation popup to double-check Email & Phone first
  const handleEmailRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const digitsOnly = phone.replace(/\D/g, '');

    if (trimmedName.length < 2) {
      setError('Please enter your full name or stage name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (digitsOnly.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (strengthScore < 2) {
      setError('Password is too weak. Please include at least numbers or a mix of uppercase and lowercase letters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    if (!agreed) {
      setError('Please agree to performer terms to continue.');
      return;
    }

    // Open Email & Phone verification popup before storing in database
    setShowVerifyPopup(true);
  };

  // Step B: Confirmed by artist -> Store directly in DB (NO confirmation email sent)
  const handleConfirmAndSave = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const { error: signUpErr } = await signUpWithEmail({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      if (signUpErr) {
        setShowVerifyPopup(false);
        setError(signUpErr.message || 'Failed to create account.');
      } else {
        setShowVerifyPopup(false);
        router.push('/onboarding');
      }
    } catch (err: any) {
      setShowVerifyPopup(false);
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (googleLoading || loading) return;
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: googleErr } = await signInWithGoogle('/onboarding');
      if (googleErr) {
        setError(googleErr.message || 'Google registration could not be initialized.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md my-auto relative py-2 font-sans">
      {/* Clean Compact Brand Header */}
      <div className="flex items-center justify-center gap-2.5 mb-4">
        <div className="w-9 h-9 flex items-center justify-center p-1 bg-white rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
          <img
            src="/logo.webp"
            alt="Magnevents Logo"
            width={32}
            height={32}
            className="object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
          Magne<span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">vents</span>
        </h1>
      </div>

      <div className="w-full p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">Create Performer Account</h2>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Option A: Google Sign-in */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleSignup}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            or
          </span>
        </div>

        {/* Option B: Email Signup Form */}
        <form onSubmit={handleEmailRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name / Stage Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full or stage name"
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-9 pr-9 py-2 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-sm transition-all ${
                      password.length === 0
                        ? 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                        : strengthScore <= 1
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                        : strengthScore === 2
                        ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-100'
                        : 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full pl-9 pr-9 py-2 bg-white border rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-sm transition-all ${
                      confirmPassword.length === 0
                        ? 'border-slate-200 focus:border-sky-500 focus:ring-sky-100'
                        : confirmPassword === password
                        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100 bg-emerald-50/20'
                        : 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-medium transition-all">
                    {confirmPassword === password ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1">
                        <X className="w-3 h-3 text-rose-500" /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-500">
                    Password strength
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      strengthScore <= 1
                        ? 'text-rose-600'
                        : strengthScore === 2
                        ? 'text-amber-600'
                        : strengthScore === 3
                        ? 'text-sky-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {strengthScore === 0
                      ? 'Too short'
                      : strengthScore === 1
                      ? 'Weak'
                      : strengthScore === 2
                      ? 'Fair'
                      : strengthScore === 3
                      ? 'Good'
                      : 'Strong'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="grid grid-cols-4 gap-1.5 h-1">
                  {[1, 2, 3, 4].map((step) => {
                    const isFilled = strengthScore >= step;
                    const barColor =
                      strengthScore <= 1
                        ? 'bg-rose-500'
                        : strengthScore === 2
                        ? 'bg-amber-500'
                        : strengthScore === 3
                        ? 'bg-sky-500'
                        : 'bg-emerald-500';
                    return (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFilled ? barColor : 'bg-slate-200'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Criteria Checklist */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-0.5 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.length ? 'text-slate-800 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {passwordCriteria.length ? (
                      <Check className="w-3 h-3 flex-shrink-0 text-emerald-600" />
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5 flex-shrink-0" />
                    )}
                    <span>8+ characters</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.hasNumber ? 'text-slate-800 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {passwordCriteria.hasNumber ? (
                      <Check className="w-3 h-3 flex-shrink-0 text-emerald-600" />
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5 flex-shrink-0" />
                    )}
                    <span>1 number</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.hasMixedCase ? 'text-slate-800 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {passwordCriteria.hasMixedCase ? (
                      <Check className="w-3 h-3 flex-shrink-0 text-emerald-600" />
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5 flex-shrink-0" />
                    )}
                    <span>Upper &amp; lowercase</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordCriteria.hasSpecial ? 'text-slate-800 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {passwordCriteria.hasSpecial ? (
                      <Check className="w-3 h-3 flex-shrink-0 text-emerald-600" />
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5 flex-shrink-0" />
                    )}
                    <span>Special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 mt-0.5 cursor-pointer"
              />
              <div className="leading-tight">
                <span>
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="font-semibold text-slate-900 underline underline-offset-2 hover:text-sky-600 transition-colors"
                  >
                    Performer Terms &amp; Conditions
                  </button>
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Please read carefully before checking the box
                </span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          <span>Already registered? </span>
          <Link href="/login" className="font-bold text-sky-600 hover:text-sky-700 hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Email & Phone Confirmation Popup before storing to DB */}
      <ModalPortal
        isOpen={showVerifyPopup}
        onClose={() => {
          if (!loading) setShowVerifyPopup(false);
        }}
      >
        <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden font-sans">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Confirm Your Details
                </h3>
              </div>
            </div>

            {/* Highlighted Contact Review Box */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-200">
              <div className="p-3 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Artist Name
                </span>
                <span className="text-xs font-bold text-slate-900 text-right truncate">
                  {fullName.trim()}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  Email
                </span>
                <span className="text-xs font-bold text-sky-700 text-right break-all">
                  {email.trim()}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Phone
                </span>
                <span className="text-xs font-bold text-emerald-700 text-right">
                  {phone.trim()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowVerifyPopup(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmAndSave}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Save</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
      {/* Performer Terms & Security Commitment Modal */}
      <PerformerTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAgreed(true);
          setShowTermsModal(false);
        }}
      />
    </div>
  );
}
