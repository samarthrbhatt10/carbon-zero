/**
 * @component App
 * @description CarbonZero root application component.
 * Manages Firebase auth state, global user profile (from Firestore),
 * and renders the full application shell.
 *
 * View state machine: splash → onboarding → auth → app
 */

import { useState, useEffect, useCallback } from 'react';
import Calculator           from './components/Calculator.jsx';
import Dashboard            from './components/Dashboard.jsx';
import ActionLibrary        from './components/ActionLibrary.jsx';
import CommunityLeaderboard from './components/CommunityLeaderboard.jsx';
import EducationalHub       from './components/EducationalHub.jsx';
import AICoach              from './components/AICoach.jsx';
import SocialShare          from './components/SocialShare.jsx';
import Profile              from './components/Profile.jsx';
import Splash               from './components/Splash.jsx';
import Onboarding           from './components/Onboarding.jsx';
import Auth                 from './components/Auth.jsx';
import ThemeToggle          from './components/ThemeToggle.jsx';

import { subscribeToAuth, logoutUser } from './services/authService.js';
import { getUserProfile, saveFootprintToDb, saveUserActionsToDb } from './services/dbService.js';
import { getFootprint, ensureSchemaVersion, isOnboardingDone, setOnboardingDone, getTheme, saveTheme } from './services/storage.js';
import './index.css';

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------
const NAV = [
  { id: 'calculate', label: 'Calculate', icon: '🧮' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'actions',   label: 'Actions',   icon: '🌿' },
  { id: 'community', label: 'Community', icon: '🏆' },
  { id: 'learn',     label: 'Learn',     icon: '📖' },
  { id: 'coach',     label: 'AI Coach',  icon: '🤖' },
  { id: 'share',     label: 'Share',     icon: '📣' },
];
const MOBILE_NAV = NAV.slice(0, 5);

// ---------------------------------------------------------------------------
// Apply theme to DOM root (called on mount and when theme changes)
// ---------------------------------------------------------------------------
function applyThemeToDom(theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

// ---------------------------------------------------------------------------
// TopNav
// ---------------------------------------------------------------------------
function TopNav({ active, onTabChange, user, userProfile, onLogout }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50, width: '100%',
      background: 'rgba(26,107,60,0.97)', backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: '1.35rem' }}>🌱</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>CarbonZero</span>
        </div>

        {/* Desktop tabs */}
        <nav className="hidden md:block">
          <ul style={{ display: 'flex', gap: 2, listStyle: 'none', margin: 0, padding: 0 }}>
            {[...NAV, { id: 'profile', label: 'Profile', icon: '👤' }].map((t) => {
              const isActive = active === t.id;
              return (
                <li key={t.id}>
                  <button onClick={() => onTabChange(t.id)} aria-current={isActive ? 'page' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      minHeight: 44, padding: '0.375rem 0.65rem',
                      borderRadius: 10, border: 'none',
                      background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.72)',
                      fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: '0.85rem' }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right: Theme + User name + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ThemeToggle />
          <button onClick={() => onTabChange('profile')} title="Profile"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 20, padding: '4px 10px 4px 6px', cursor: 'pointer' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2D9156', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
              {(userProfile?.displayName || user?.displayName || user?.email || 'U')[0]?.toUpperCase()}
            </div>
            <span className="hidden sm:inline" style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 600, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile?.displayName || user?.displayName || user?.email?.split('@')[0]}
            </span>
          </button>
          <button onClick={onLogout} title="Log Out"
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
            ↪
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// BottomNav (mobile)
// ---------------------------------------------------------------------------
function BottomNav({ active, onTabChange }) {
  return (
    <nav className="md:hidden" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', backgroundColor: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
    }}>
      {[...MOBILE_NAV, { id: 'profile', label: 'Profile', icon: '👤' }].map((t) => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onTabChange(t.id)} aria-current={isActive ? 'page' : undefined}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2, minHeight: 56, padding: '0.5rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: '0.6rem', fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontFamily: 'Inter, sans-serif', position: 'relative', transition: 'color 0.15s',
            }}>
            <span style={{ fontSize: '1.15rem' }}>{t.icon}</span>
            <span>{t.label}</span>
            {isActive && <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, borderRadius: 1, background: 'var(--color-primary)' }} />}
          </button>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------
export default function App() {
  const [view, setView]                       = useState('splash'); // splash|onboarding|auth|app
  const [firebaseUser, setFirebaseUser]       = useState(null);
  const [userProfile, setUserProfile]         = useState(null);
  const [activeTab, setActiveTab]             = useState('calculate');
  const [footprintResult, setFootprintResult] = useState(null);
  const [authLoading, setAuthLoading]         = useState(true);

  // Apply stored theme on first paint
  useEffect(() => {
    ensureSchemaVersion();
    applyThemeToDom(getTheme());
  }, []);

  // Firebase auth state listener (the ONLY source of truth for login state)
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          setUserProfile(profile);
          if (profile?.theme) applyThemeToDom(profile.theme);
        } catch (e) {
          console.warn('Profile fetch failed:', e.message);
        }
        setView('app');
      } else {
        setUserProfile(null);
        if (!isOnboardingDone()) {
          setView('onboarding');
        } else {
          setView('auth');
        }
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSplashFinish = () => {
    // Auth state listener will determine the next view.
    // If still loading, stay on splash until resolved.
    if (!authLoading) {
      if (!firebaseUser) {
        setView(isOnboardingDone() ? 'auth' : 'onboarding');
      }
    }
  };

  const handleOnboardingComplete = () => {
    setOnboardingDone();
    setView('auth');
  };

  const handleLogin = (fbUser) => {
    // Auth listener will fire and set the view to 'app'
    setFirebaseUser(fbUser);
  };

  const handleLogout = async () => {
    await logoutUser();
    setFirebaseUser(null);
    setUserProfile(null);
    setFootprintResult(null);
    setView('auth');
  };

  const handleCalculatorComplete = useCallback(async (result) => {
    setFootprintResult(result);
    if (firebaseUser) {
      try {
        await saveFootprintToDb(firebaseUser.uid, result);
        setUserProfile(prev => prev ? ({
          ...prev,
          totalFootprint: result.totalMonthly,
          carbonGrade: result.grade,
        }) : prev);
      } catch (e) {
        console.warn('DB save failed:', e.message);
      }
    }
    setTimeout(() => setActiveTab('dashboard'), 800);
  }, [firebaseUser]);

  const handleProfileUpdate = useCallback((updates) => {
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'calculate':  return <Calculator onComplete={handleCalculatorComplete} />;
      case 'dashboard':  return <Dashboard result={footprintResult} />;
      case 'actions':    return <ActionLibrary uid={firebaseUser?.uid} onSave={saveUserActionsToDb} />;
      case 'community':  return <CommunityLeaderboard />;
      case 'learn':      return <EducationalHub />;
      case 'coach':      return <AICoach footprintResult={footprintResult} />;
      case 'share':      return <SocialShare result={footprintResult} />;
      case 'profile':    return (
        <Profile
          user={firebaseUser}
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate}
          onLogout={handleLogout}
        />
      );
      default: return <Calculator onComplete={handleCalculatorComplete} />;
    }
  };

  // Splash shows until auth listener resolves (or 1.8s, whichever is first)
  if (view === 'splash' || (view === 'splash' && authLoading)) {
    return <Splash onFinish={handleSplashFinish} />;
  }
  if (view === 'onboarding') return <Onboarding onComplete={handleOnboardingComplete} />;
  if (view === 'auth')       return <Auth onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <TopNav
        active={activeTab}
        onTabChange={setActiveTab}
        user={firebaseUser}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
      <main style={{ flex: 1, paddingBottom: '5rem' }} id="main-content">
        {renderTab()}
      </main>
      <BottomNav active={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
