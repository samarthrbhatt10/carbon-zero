import { useState, useRef } from 'react';
import { updateUserProfile, addPointsToDb } from '../services/dbService.js';
import { changePassword, deleteAccount, logoutUser, authErrorMessage } from '../services/authService.js';
import { saveTheme, getTheme } from '../services/storage.js';
import ThemeToggle from './ThemeToggle.jsx';

const CARBON_GRADES = { A: '#2F855A', B: '#68D391', C: '#F6E05E', D: '#F6AD55', E: '#FC8181', F: '#C53030' };

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{value ?? '—'}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {sub && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{sub}</span>}
    </div>
  );
}

export default function Profile({ user, userProfile, onProfileUpdate, onLogout }) {
  const [editing, setEditing]             = useState(false);
  const [displayName, setDisplayName]     = useState(userProfile?.displayName || user?.displayName || '');
  const [bio, setBio]                     = useState(userProfile?.bio || '');
  const [city, setCity]                   = useState(userProfile?.city || '');
  const [saving, setSaving]               = useState(false);
  const [saveMsg, setSaveMsg]             = useState('');

  // Password change state
  const [showPwSection, setShowPwSection] = useState(false);
  const [curPw, setCurPw]                 = useState('');
  const [newPw, setNewPw]                 = useState('');
  const [pwMsg, setPwMsg]                 = useState('');
  const [pwLoading, setPwLoading]         = useState(false);

  // Delete state
  const [showDelete, setShowDelete]       = useState(false);
  const [deletePw, setDeletePw]           = useState('');
  const [deleteMsg, setDeleteMsg]         = useState('');

  const profile = userProfile || {};
  const grade   = profile.carbonGrade || null;
  const gradeColor = grade ? CARBON_GRADES[grade] || '#9CA3AF' : '#9CA3AF';

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim(), bio: bio.trim(), city: city.trim() });
      onProfileUpdate({ displayName: displayName.trim(), bio: bio.trim(), city: city.trim() });
      setSaveMsg('Profile updated!');
      setEditing(false);
    } catch (e) {
      setSaveMsg('Error saving: ' + e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleChangePassword = async () => {
    setPwLoading(true); setPwMsg('');
    try {
      await changePassword(curPw, newPw);
      setPwMsg('Password changed successfully!');
      setCurPw(''); setNewPw('');
      setShowPwSection(false);
    } catch (e) {
      setPwMsg(authErrorMessage(e.code) || e.message);
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(deletePw);
      onLogout();
    } catch (e) {
      setDeleteMsg(authErrorMessage(e.code) || e.message);
    }
  };

  const inputStyle = {
    width: '100%', minHeight: 40, padding: '0.5rem 0.75rem',
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1.5px solid var(--color-border)', borderRadius: 8,
    fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', outline: 'none',
  };
  const sectionStyle = {
    background: 'var(--color-surface)', borderRadius: 20,
    padding: '1.5rem', border: '1px solid var(--color-border)',
    display: 'flex', flexDirection: 'column', gap: '1rem',
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem 6rem' }}>
      {/* Header */}
      <div style={{ ...sectionStyle, flexDirection: 'row', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${gradeColor}33, ${gradeColor}22)`,
          border: `3px solid ${gradeColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 800, color: gradeColor,
        }}>
          {grade || (profile.displayName || displayName || 'U')[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            {profile.displayName || displayName || user?.email}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            {profile.city && `📍 ${profile.city}  •  `}{user?.email}
          </p>
          {profile.bio && <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--color-text)', fontStyle: 'italic' }}>{profile.bio}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setEditing(!editing)} style={{
            padding: '0.5rem 1rem', borderRadius: 8, border: '1.5px solid var(--color-border)',
            background: 'transparent', color: 'var(--color-text)', fontSize: '0.82rem',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            {editing ? 'Cancel' : '✏️ Edit Profile'}
          </button>
          <button onClick={onLogout} style={{
            padding: '0.5rem 1rem', borderRadius: 8, border: 'none',
            background: 'rgba(229,62,62,0.1)', color: '#C53030', fontSize: '0.82rem',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            Log Out
          </button>
        </div>
      </div>

      {saveMsg && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(47,133,90,0.08)', border: '1px solid rgba(47,133,90,0.2)', borderRadius: 10, color: 'var(--color-success)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          ✅ {saveMsg}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ ...sectionStyle, marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Edit Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</label>
              <input style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>City</label>
              <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bio</label>
            <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell your story…" maxLength={200} />
          </div>
          <button onClick={handleSaveProfile} disabled={saving} style={{
            padding: '0.6rem 1.5rem', background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', alignSelf: 'flex-start',
          }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
        <StatCard icon="⚡" label="Carbon Grade" value={grade || 'N/A'} sub="Based on last calculation" />
        <StatCard icon="🏅" label="Points" value={profile.points ?? 0} sub="Keep going!" />
        <StatCard icon="🔥" label="Day Streak" value={profile.streak ?? 0} sub="Consecutive days" />
        <StatCard icon="🌿" label="Active Actions" value={profile.activeActions?.length ?? 0} sub="In your plan" />
        <StatCard icon="🏆" label="Badges Earned" value={profile.badges?.length ?? 0} sub={`of 10 total`} />
        {profile.totalFootprint != null && (
          <StatCard icon="☁️" label="CO₂/Month" value={`${profile.totalFootprint.toFixed(1)} kg`} sub="Latest result" />
        )}
      </div>

      {/* Badges showcase */}
      {profile.badges?.length > 0 && (
        <div style={{ ...sectionStyle, marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>🏆 Earned Badges</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {profile.badges.map(b => (
              <span key={b} style={{ padding: '0.4rem 0.75rem', background: 'rgba(26,107,60,0.1)', color: 'var(--color-primary)', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Appearance */}
      <div style={{ ...sectionStyle, marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>🎨 Appearance</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>Theme</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Choose Light, Dark, or follow System setting</p>
          </div>
          <ThemeToggle onSave={(t) => updateUserProfile(user.uid, { theme: t }).catch(() => {})} />
        </div>
      </div>

      {/* Account Security */}
      <div style={{ ...sectionStyle, marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>🔐 Account Security</h3>
        <button onClick={() => setShowPwSection(!showPwSection)} style={{
          padding: '0.5rem 1rem', background: 'transparent',
          border: '1.5px solid var(--color-border)', borderRadius: 8,
          color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer',
          fontSize: '0.82rem', fontFamily: 'Inter, sans-serif', alignSelf: 'flex-start',
        }}>
          {showPwSection ? 'Cancel' : 'Change Password'}
        </button>
        {showPwSection && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pwMsg && <div style={{ padding: '0.6rem 0.875rem', background: pwMsg.includes('success') ? 'rgba(47,133,90,0.08)' : 'rgba(229,62,62,0.08)', color: pwMsg.includes('success') ? 'var(--color-success)' : '#C53030', borderRadius: 8, fontSize: '0.8rem' }}>{pwMsg}</div>}
            <input type="password" style={inputStyle} placeholder="Current password" value={curPw} onChange={e => setCurPw(e.target.value)} />
            <input type="password" style={inputStyle} placeholder="New password (min 6 chars)" value={newPw} onChange={e => setNewPw(e.target.value)} minLength={6} />
            <button onClick={handleChangePassword} disabled={pwLoading || !curPw || newPw.length < 6} style={{
              padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', alignSelf: 'flex-start',
            }}>
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        )}
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          Account: <strong>{user?.email}</strong> · Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
        </p>
      </div>

      {/* Danger Zone */}
      <div style={{ ...sectionStyle, border: '1px solid rgba(229,62,62,0.25)', background: 'rgba(229,62,62,0.02)' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#C53030' }}>⚠️ Danger Zone</h3>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Permanently delete your account and all data. This action cannot be undone.</p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} style={{
            padding: '0.5rem 1rem', background: 'transparent',
            border: '1.5px solid rgba(229,62,62,0.4)', borderRadius: 8,
            color: '#C53030', fontWeight: 700, cursor: 'pointer',
            fontSize: '0.82rem', fontFamily: 'Inter, sans-serif', alignSelf: 'flex-start',
          }}>Delete My Account</button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {deleteMsg && <div style={{ padding: '0.6rem 0.875rem', background: 'rgba(229,62,62,0.08)', color: '#C53030', borderRadius: 8, fontSize: '0.8rem' }}>{deleteMsg}</div>}
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text)', fontWeight: 600 }}>Enter your password to confirm deletion:</p>
            <input type="password" style={{ ...inputStyle, borderColor: 'rgba(229,62,62,0.4)' }} placeholder="Password" value={deletePw} onChange={e => setDeletePw(e.target.value)} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDeleteAccount} style={{ padding: '0.5rem 1rem', background: '#C53030', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}>Confirm Delete</button>
              <button onClick={() => { setShowDelete(false); setDeleteMsg(''); setDeletePw(''); }} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1.5px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.82rem' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
