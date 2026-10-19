'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, LockKeyhole, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      window.setTimeout(() => {
        router.replace('/');
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update your password. Request a new reset link and try again.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-visual"><Link href="/" className="auth-brand"><span className="auth-brand-icon"><Sparkles size={22}/></span><span>Opportunity<span>Kit</span></span></Link><div className="auth-visual-copy"><div className="auth-eyebrow"><span/> ACCOUNT SECURITY</div><h1>A fresh start,<br/><span>one step away.</span></h1><p>Choose a strong new password to keep your OpportunityKit workspace secure.</p></div><div className="auth-visual-footer">Built for students who build things.</div><div className="auth-glow auth-glow-one"/></section><section className="auth-panel-wrap"><div className="auth-panel"><Link href="/login" className="auth-back">← Back to sign in</Link><div className="auth-heading-icon"><LockKeyhole size={22}/></div><div className="auth-kicker">RESET YOUR PASSWORD</div><div className="auth-heading"><h2>Choose a new password</h2><p>Use at least 8 characters for your new password.</p></div>{error&&<div className="auth-alert auth-alert-error" role="alert">{error}</div>}{success&&<div className="auth-alert auth-alert-success" role="status"><CheckCircle2 size={15}/> Password updated. Redirecting you to your workspace…</div>}<form className="auth-form" onSubmit={handleSubmit}><label>New password<div className="auth-input-wrap"><LockKeyhole size={17}/><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></div></label><label>Confirm new password<div className="auth-input-wrap"><LockKeyhole size={17}/><input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Enter it again"/></div></label><button className="auth-submit" type="submit" disabled={loading||success}>{loading?'Updating…':'Update password'} {!loading&&<ArrowRight size={17}/>}</button></form><div className="auth-security"><LockKeyhole size={13}/> Secure authentication powered by Supabase</div></div></section></main>;
}
