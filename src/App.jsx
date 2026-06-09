import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { auth } from './firebase';
import { useStore } from './store';
import { subscribeTasks, subscribeHistory } from './db';
import LoginPage from './pages/LoginPage';
import AppShell from './pages/AppShell';

export default function App() {
  const { user, setUser, setTasks, setHistory, setLoading } = useStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubTasks = subscribeTasks(user.uid, setTasks);
    const unsubHistory = subscribeHistory(user.uid, setHistory);
    return () => { unsubTasks(); unsubHistory(); };
  }, [user?.uid]);

  const { loading } = useStore();

  if (loading) return <LoadingScreen />;
  if (!user)   return <LoginPage />;
  return (
    <>
      <AppShell />
      <Toaster
        position="top-center"
        toastOptions={{ className: 'custom-toast', duration: 3000 }}
      />
    </>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: '16px',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '14px',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', animation: 'glowPulse 2s ease infinite',
      }}>⚡</div>
      <div style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>Loading…</div>
    </div>
  );
}
