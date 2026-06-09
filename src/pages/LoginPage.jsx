import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      toast.error('Sign in failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {/* Background grid */}
      <div style={styles.grid} aria-hidden />
      <div style={styles.gradientOrb1} aria-hidden />
      <div style={styles.gradientOrb2} aria-hidden />

      <div style={styles.card} className="animate-fadeIn">
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>⚡</div>
          <div style={styles.logoTextWrap}>
            <span style={styles.logoBrand}>Priority</span>
            <span style={styles.logoFlow}>Flow</span>
          </div>
        </div>

        <p style={styles.tagline}>
          AI-powered daily task prioritization for people who mean business.
        </p>

        <div style={styles.divider} />

        {/* Feature list */}
        <ul style={styles.features}>
          {[
            ['🎯', 'Smart rules-based prioritization'],
            ['🤖', 'AI task recommendations'],
            ['↕️', 'Drag-and-drop reordering'],
            ['📊', 'Analytics & history tracking'],
            ['📶', 'Works offline'],
          ].map(([icon, text]) => (
            <li key={text} style={styles.featureItem}>
              <span style={styles.featureIcon}>{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            ...styles.googleBtn,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <span className="animate-spin" style={{ fontSize: '18px' }}>⟳</span>
          ) : (
            <GoogleIcon />
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p style={styles.privacy}>
          Your data is private and never shared. Each account is isolated.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'var(--bg)',
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(61,124,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(61,124,255,0.05) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
  },
  gradientOrb1: {
    position: 'absolute', width: '400px', height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(61,124,255,0.12) 0%, transparent 70%)',
    top: '-10%', left: '-10%', pointerEvents: 'none',
  },
  gradientOrb2: {
    position: 'absolute', width: '300px', height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,229,196,0.1) 0%, transparent 70%)',
    bottom: '5%', right: '-5%', pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: '400px',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-xl)',
    padding: '36px 32px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(61,124,255,0.1)',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px',
  },
  logoIcon: {
    width: '48px', height: '48px', borderRadius: '14px',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', boxShadow: '0 4px 20px var(--accent-glow)',
  },
  logoTextWrap: {
    display: 'flex', flexDirection: 'column', lineHeight: 1,
  },
  logoBrand: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800, fontSize: '1.4rem',
    color: 'var(--text)',
    letterSpacing: '-0.02em',
  },
  logoFlow: {
    fontFamily: 'var(--font-display)',
    fontWeight: 400, fontSize: '1.4rem',
    color: 'var(--accent-light)',
    letterSpacing: '-0.02em',
  },
  tagline: {
    color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.6,
    marginBottom: '24px',
  },
  divider: {
    height: '1px', background: 'var(--border)', marginBottom: '20px',
  },
  features: {
    listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px',
    marginBottom: '28px',
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '0.875rem', color: 'var(--text-2)',
  },
  featureIcon: { fontSize: '1rem', width: '24px', flexShrink: 0, textAlign: 'center' },
  googleBtn: {
    width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    padding: '14px 20px',
    background: 'white',
    color: '#1a1a2e',
    fontFamily: 'var(--font-display)',
    fontWeight: 600, fontSize: '0.9rem',
    borderRadius: 'var(--r-md)',
    transition: 'all 0.2s',
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
  },
  privacy: {
    marginTop: '16px', textAlign: 'center',
    fontSize: '0.75rem', color: 'var(--text-3)',
    lineHeight: 1.5,
  },
};
