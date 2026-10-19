'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'signup';

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const isSignup = mode === 'signup';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace('/');
          router.refresh();
          return;
        }
        setNotice('Account created. Check your inbox for the verification link, then come back to sign in.');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        const next = searchParams.get('next');
        router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
        router.refresh();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter your email address first, and we will send you a reset link.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice('If an account exists for that email, a password reset link is on its way.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request a password reset.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link href="/" className="auth-brand"><span className="auth-brand-icon"><Sparkles size={22}/></span><span>Opportunity<span>Kit</span></span></Link>
        <div className="auth-visual-copy">
          <div className="auth-eyebrow"><span/> YOUR NEXT CHAPTER STARTS HERE</div>
          <h1>Find the opportunity<br/>that moves <span>you forward.</span></h1>
          <p>One workspace for hackathons, internships, scholarships and the next big thing you will build.</p>
          <div className="auth-feature-list"><div><CheckCircle2 size={17}/> Discover opportunities that fit your goals</div><div><CheckCircle2 size={17}/> Save programs and track applications</div><div><CheckCircle2 size={17}/> Keep your career journey in one place</div></div>
        </div>
        <div className="auth-visual-footer">Built for students who build things.</div>
        <div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
      </section>
      <section className="auth-panel-wrap">
        <div className="auth-panel">
          <Link href="/" className="auth-back"><ArrowLeft size={15}/> Back to OpportunityKit</Link>
          <div className="auth-mobile-brand"><Sparkles size={19}/> Opportunity<span>Kit</span></div>
          <div className="auth-heading">
            <div className="auth-heading-icon">{isSignup ? <UserRound size={22}/> : <LockKeyhole size={22}/>}</div>
            <div className="auth-kicker">{isSignup ? 'CREATE YOUR WORKSPACE' : 'WELCOME BACK'}</div>
            <h2>{isSignup ? 'Create your account' : 'Sign in to your account'}</h2>
            <p>{isSignup ? 'Your next opportunity is closer than you think.' : 'Pick up where your next big move begins.'}</p>
          </div>
          {error && <div className="auth-alert auth-alert-error" role="alert">{error}</div>}
          {notice && <div className="auth-alert auth-alert-success" role="status">{notice}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && <label>Full name<div className="auth-input-wrap"><UserRound size={17}/><input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required maxLength={80}/></div></label>}
            <label>Email address<div className="auth-input-wrap"><Mail size={17}/><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div></label>
            <label>Password<div className="auth-input-wrap"><LockKeyhole size={17}/><input type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'} required minLength={8}/><button type="button" className="auth-password-toggle" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
            {!isSignup && <button type="button" className="auth-forgot" onClick={handleResetPassword} disabled={loading}>Forgot password?</button>}
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'} {!loading && <ArrowRight size={17}/>}</button>
          </form>
          <div className="auth-switch">{isSignup ? 'Already have an account?' : "Don't have an account?"} <Link href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create account'}</Link></div>
          <div className="auth-security"><LockKeyhole size={13}/> Secure authentication powered by Supabase</div>
        </div>
      </section>
    </main>
  );
}
