/**
 * @component CommunityLeaderboard
 * @description Minimalist high-contrast ranking table of 20 seeded Indian users.
 * Google I/O 2026 aesthetic — matte glass, circular grade rings, thin rows.
 *
 * Data: src/data/leaderboard.json
 */

import leaderboardData from '../data/leaderboard.json';
import { gradeColor, gradeLabel } from '../utils/formatters.js';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const T = {
  primary:  '#1A6B3C',
  muted:    '#6B7280',
  baseline: '#E5E7EB',
  glass:    'rgba(248,251,247,0.82)',
  success:  '#2F855A',
  gold:     '#D97706',
  silver:   '#6B7280',
  bronze:   '#92400E',
};

const BADGE_META = ['first_step', 'green_commuter', 'solar_champ', 'plant_pioneer', 'week_warrior', 'eco_sharer'];

const BADGE_LABELS = {
  first_step:    { icon: '🌱', label: 'First Step'    },
  green_commuter:{ icon: '🚲', label: 'Green Commuter' },
  solar_champ:   { icon: '☀️', label: 'Solar Champ'   },
  plant_pioneer: { icon: '🥗', label: 'Plant Pioneer'  },
  week_warrior:  { icon: '🏆', label: 'Week Warrior'   },
  eco_sharer:    { icon: '📣', label: 'Eco Sharer'     },
};

// ---------------------------------------------------------------------------
// Circular grade ring
// ---------------------------------------------------------------------------

function GradeRing({ grade, size = 36 }) {
  const color = gradeColor(grade);
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background: `${color}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 800, color,
        flexShrink: 0,
        boxShadow: `0 0 0 3px ${color}12`,
      }}
      aria-label={`Grade ${grade}: ${gradeLabel(grade)}`}
    >
      {grade}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rank medal
// ---------------------------------------------------------------------------

function RankBadge({ rank }) {
  const color = rank === 1 ? T.gold : rank === 2 ? T.silver : rank === 3 ? T.bronze : T.muted;
  const bg    = rank <= 3 ? `${color}14` : 'transparent';
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: bg, border: rank <= 3 ? `1.5px solid ${color}55` : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: rank <= 3 ? '0.9rem' : '0.72rem',
      fontWeight: 700, color,
      flexShrink: 0,
    }}>
      {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : `#${rank}`}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat summary row
// ---------------------------------------------------------------------------

function StatRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      padding: '0.6rem 1rem',
      borderRadius: 12, background: '#fff',
      border: '1px solid rgba(229,231,235,0.8)',
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    }}>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, color, letterSpacing: '-0.01em' }}>{value}</p>
      <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: T.muted }}>
        {label}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CommunityLeaderboard() {
  const totalSaved     = leaderboardData.reduce((s, u) => s + u.co2ReducedKg, 0);
  const avgDaysActive  = Math.round(leaderboardData.reduce((s, u) => s + u.daysActive, 0) / leaderboardData.length);

  return (
    <section
      style={{ width: '100%', maxWidth: 1024, margin: '0 auto', padding: '2.5rem 1rem',
               display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
      aria-label="Community Leaderboard"
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: T.primary,
                     letterSpacing: '-0.03em', marginBottom: 4 }}>
          Community Leaderboard
        </h2>
        <p style={{ color: T.muted, fontSize: '0.9rem' }}>
          Top carbon reducers across Indian cities. Complete your calculator to join the board.
        </p>
      </div>

      {/* Community stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}
           className="sm:grid-cols-3">
        <StatRow label="Total CO₂ Saved" value={`${(totalSaved / 1000).toFixed(2)}t`} color={T.primary} />
        <StatRow label="Active Members"  value={leaderboardData.length}               color="#7C3AED"   />
        <StatRow label="Avg Days Active" value={`${avgDaysActive}d`}                  color={T.gold}    />
      </div>

      {/* Table glass panel */}
      <div style={{
        background: T.glass,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 20,
        border: '1px solid rgba(229,231,235,0.65)',
        boxShadow: '0 4px 24px rgba(26,107,60,0.06)',
        overflow: 'hidden',
      }}>
        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 36px 1fr 100px 80px',
          gap: '0 1rem',
          padding: '0.75rem 1.25rem',
          borderBottom: `1px solid ${T.baseline}`,
        }}
          className="sm:grid-cols-[40px_36px_1fr_100px_80px_auto]"
        >
          {['Rank','Grd','Name & City','CO₂ Saved','Days','Badges'].map((h) => (
            <p key={h} style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
                                textTransform: 'uppercase', color: T.muted }}>
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        {leaderboardData.map((user, idx) => (
          <div
            key={user.rank}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 36px 1fr 100px 80px',
              gap: '0 1rem',
              padding: '0.875rem 1.25rem',
              borderBottom: idx < leaderboardData.length - 1 ? `1px solid ${T.baseline}` : 'none',
              alignItems: 'center',
              transition: 'background 0.15s',
              background: idx < 3 ? `${gradeColor(user.grade)}05` : 'transparent',
            }}
            className="sm:grid-cols-[40px_36px_1fr_100px_80px_auto] leaderboard-row"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,107,60,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = idx < 3 ? `${gradeColor(user.grade)}05` : 'transparent'; }}
          >
            {/* Rank */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RankBadge rank={user.rank} />
            </div>

            {/* Grade ring */}
            <GradeRing grade={user.grade} size={34} />

            {/* Name + city */}
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>
                {user.displayName}
              </p>
              <p style={{ fontSize: '0.72rem', color: T.muted, lineHeight: 1.2 }}>
                {user.city}, {user.state}
              </p>
            </div>

            {/* CO₂ saved */}
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: T.success }}>
              −{user.co2ReducedKg.toFixed(1)} kg
            </p>

            {/* Days active */}
            <p style={{ fontSize: '0.82rem', color: T.muted, fontWeight: 500 }}>
              {user.daysActive}d
            </p>

            {/* Badges — hidden below sm, shown with CSS utility class */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} className="hidden sm:flex">
              {user.badges.map((b) => (
                <span
                  key={b}
                  title={BADGE_LABELS[b]?.label ?? b}
                  aria-label={BADGE_LABELS[b]?.label ?? b}
                  style={{ fontSize: '0.95rem', cursor: 'default' }}
                >
                  {BADGE_LABELS[b]?.icon ?? '🏅'}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA to join */}
      <div style={{
        textAlign: 'center', padding: '1.5rem',
        borderRadius: 16, border: `1px dashed ${T.baseline}`,
        background: 'rgba(248,251,247,0.5)',
      }}>
        <p style={{ fontSize: '0.88rem', color: T.muted, marginBottom: 4 }}>
          🌍 Your spot on the board is waiting.
        </p>
        <p style={{ fontSize: '0.78rem', color: T.muted }}>
          Complete the Calculator to calculate your footprint and track your reductions.
        </p>
      </div>
    </section>
  );
}
