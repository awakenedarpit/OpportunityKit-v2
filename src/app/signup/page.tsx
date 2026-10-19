import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';

export default function SignupPage() {
  return <Suspense fallback={<main className="auth-loading">Loading sign up…</main>}><AuthForm mode="signup" /></Suspense>;
}
