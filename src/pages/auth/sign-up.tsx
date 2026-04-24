import { SignUp } from '@clerk/clerk-react';
import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-20"
      style={{ background: '#0D0D0D' }}
    >
      <title>Create Account — NearFix</title>
      <meta name="description" content="Join NearFix to book trusted local service providers near you." />

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: '#FF6B00', boxShadow: '0 0 20px rgba(255,107,0,0.5)' }}
        >
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <span
          className="text-2xl font-bold text-white tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Near<span style={{ color: '#FF6B00' }}>Fix</span>
        </span>
      </Link>

      <div className="w-full max-w-md">
        <SignUp
          routing="path"
          path="/auth/sign-up"
          signInUrl="/auth/sign-in"
          forceRedirectUrl="/auth/post-auth"
          fallbackRedirectUrl="/auth/post-auth"
          appearance={{
            variables: {
              colorPrimary: '#FF6B00',
              colorBackground: '#161616',
              colorInputBackground: '#1e1e1e',
              colorInputText: '#ffffff',
              colorText: '#ffffff',
              colorTextSecondary: 'rgba(255,255,255,0.5)',
              colorNeutral: 'rgba(255,255,255,0.15)',
              borderRadius: '12px',
              fontFamily: 'var(--font-sans)',
            },
            elements: {
              card: {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(20px)',
              },
              headerTitle: {
                color: '#ffffff',
                fontFamily: 'var(--font-heading)',
              },
              headerSubtitle: {
                color: 'rgba(255,255,255,0.5)',
              },
              socialButtonsBlockButton: {
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
              },
              dividerLine: {
                background: 'rgba(255,255,255,0.1)',
              },
              dividerText: {
                color: 'rgba(255,255,255,0.35)',
              },
              formFieldLabel: {
                color: 'rgba(255,255,255,0.6)',
              },
              formFieldInput: {
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
              },
              formButtonPrimary: {
                background: '#FF6B00',
                boxShadow: '0 6px 20px rgba(255,107,0,0.4)',
              },
              footerActionLink: {
                color: '#FF6B00',
              },
            },
          }}
        />
      </div>
    </div>
  );
}
