import { useState, useEffect } from 'react';
import { validateEmail, validateText } from '../utils/validators.js';
import { registerUser, loginUser, authErrorMessage, sendPasswordReset } from '../services/authService.js';

export default function Auth({ onLogin }) {
  const [mode, setMode]           = useState('login'); // 'login' | 'register' | 'reset'
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity]           = useState('');
  const [error, setError]         = useState('');
  const [info, setInfo]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPw, setShowPw]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      if (mode === 'reset') {
        await sendPasswordReset(validateEmail(email));
        setInfo('Password reset email sent! Check your inbox.');
        setLoading(false);
        return;
      }
      let user;
      if (mode === 'register') {
        const safeName = validateText(displayName, 50);
        if (!safeName) throw { code: 'bad-name', message: 'Name cannot be empty.' };
        user = await registerUser({ email: validateEmail(email), password, displayName: safeName, city: validateText(city, 80) });
      } else {
        user = await loginUser({ email: validateEmail(email), password });
      }
      onLogin(user);
    } catch (err) {
      setError(authErrorMessage(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', minHeight: 44, padding: '0.6rem 0.875rem',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)', borderRadius: 8,
    fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const labelStyle = {
    display: 'block', fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--color-text-muted)', marginBottom: 4,
    letterSpacing: '0.04em', textTransform: 'uppercase',
  };

  const titles = { login: 'Welcome Back', register: 'Create Account', reset: 'Reset Password' };
  const subtitles = {
    login: 'Log in to your CarbonZero dashboard.',
    register: 'Join thousands tracking their carbon footprint.',
    reset: 'Enter your email to receive a reset link.',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '2rem',
    }}>
      {/* Decorative background blobs */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,107,60,0.08) 0%, transparent 70%)',
          top: '-10%', left: '-10%',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)',
          bottom: '-5%', right: '-5%',
        }} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          position: 'relative', zIndex: 1,
          maxWidth: 400, width: '100%',
          background: 'var(--color-surface)',
          borderRadius: 24, padding: '2.5rem 2rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          border: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column', gap: '1.125rem',
        }}
        className="animate-fade-in"
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, rgba(26,107,60,0.15), rgba(45,145,86,0.1))',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.5rem',
          }}>🌿</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0, letterSpacing: '-0.03em' }}>
            {titles[mode]}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            {subtitles[mode]}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)', color: '#C53030', borderRadius: 8, fontSize: '0.82rem', display: 'flex', gap: 8 }}>
            ⚠️ {error}
          </div>
        )}
        {info && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(47,133,90,0.08)', border: '1px solid rgba(47,133,90,0.2)', color: 'var(--color-success)', borderRadius: 8, fontSize: '0.82rem', display: 'flex', gap: 8 }}>
            ✅ {info}
          </div>
        )}

        {/* Register-only fields */}
        {mode === 'register' && (
          <>
            <div>
              <label style={labelStyle} htmlFor="auth-name">Full Name</label>
              <input id="auth-name" style={inputStyle} value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onFocus={e => { e.target.style.borderColor = '#1A6B3C'; e.target.style.boxShadow = '0 0 0 3px rgba(26,107,60,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                placeholder="Jane Doe" required />
            </div>
            <div>
              <label style={labelStyle} htmlFor="auth-city">City (optional)</label>
              <input id="auth-city" style={inputStyle} value={city}
                onChange={e => setCity(e.target.value)}
                onFocus={e => { e.target.style.borderColor = '#1A6B3C'; e.target.style.boxShadow = '0 0 0 3px rgba(26,107,60,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                placeholder="Mumbai" />
            </div>
          </>
        )}

        {/* Email */}
        <div>
          <label style={labelStyle} htmlFor="auth-email">Email Address</label>
          <input id="auth-email" type="email" style={inputStyle} value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={e => { e.target.style.borderColor = '#1A6B3C'; e.target.style.boxShadow = '0 0 0 3px rgba(26,107,60,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
            placeholder="jane@example.com" required autoComplete="email" />
        </div>

        {/* Password */}
        {mode !== 'reset' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={labelStyle} htmlFor="auth-password">Password</label>
              {mode === 'login' && (
                <button type="button" onClick={() => { setMode('reset'); setError(''); setInfo(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                  Forgot?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input id="auth-password" type={showPw ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.5rem' }}
                value={password} onChange={e => setPassword(e.target.value)}
                onFocus={e => { e.target.style.borderColor = '#1A6B3C'; e.target.style.boxShadow = '0 0 0 3px rgba(26,107,60,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading}
          style={{
            width: '100%', minHeight: 48, padding: '0 1.25rem',
            background: loading ? 'var(--color-border)' : 'var(--color-primary)',
            color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.95rem',
            border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', marginTop: '0.25rem',
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'bounce 1.2s 0s infinite' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'bounce 1.2s 0.2s infinite' }} />
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'bounce 1.2s 0.4s infinite' }} />
            </span>
          ) : mode === 'login' ? 'Log In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
        </button>

        {/* Mode switchers */}
        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          {mode === 'login' ? (
            <>New here? <button type="button" onClick={() => { setMode('register'); setError(''); setInfo(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Create account
            </button></>
          ) : (
            <>Already have an account? <button type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Log in
            </button></>
          )}
        </div>
      </form>
      <style>{`@keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-8px); } }`}</style>
    </div>
  );
}
