import { useEffect } from 'react';

export default function Splash({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)',
      flexDirection: 'column', gap: '1rem'
    }}>
      <div className="animate-fade-in" style={{ textAlign: 'center', animationDuration: '1.2s' }}>
        <div style={{
          width: 80, height: 80, margin: '0 auto 1.5rem',
          background: 'rgba(47,133,90,0.15)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem', boxShadow: '0 0 0 8px rgba(47,133,90,0.05)',
        }}>
          🌱
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.04em', margin: 0 }}>
          CarbonZero
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: 8, fontWeight: 500 }}>
          Know it. Shrink it. Own it.
        </p>
      </div>
    </div>
  );
}
