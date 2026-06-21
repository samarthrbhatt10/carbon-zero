/**
 * @component ActionLibrary
 * @description 58-action carbon reduction library with category + difficulty filtering.
 * Google I/O 2026 Material Ethereal aesthetic — matte glass panels, thin badges, hover lift.
 *
 * Data: src/data/actions.json
 * Security: no user input processed; data is static JSON.
 */

import { useState, useMemo } from 'react';
import actionsData from '../data/actions.json';

// ---------------------------------------------------------------------------
// Design tokens (shared IO-2026 palette)
// ---------------------------------------------------------------------------
const T = {
  primary:  '#1A6B3C',
  accent:   '#F5A623',
  muted:    '#6B7280',
  baseline: '#E5E7EB',
  glass:    'rgba(248,251,247,0.82)',
  success:  '#2F855A',
  danger:   '#E53E3E',
};

const CATEGORY_META = {
  transport: { label: 'Transport', icon: '🚗', color: '#1A6B3C' },
  energy:    { label: 'Energy',    icon: '⚡', color: '#F5A623' },
  food:      { label: 'Food',      icon: '🥗', color: '#2F855A' },
  shopping:  { label: 'Shopping',  icon: '🛍️', color: '#E53E3E' },
  advocacy:  { label: 'Advocacy',  icon: '📣', color: '#7C3AED' },
};

const DIFFICULTY_META = {
  Easy:   { color: '#2F855A', bg: 'rgba(47,133,90,0.09)'   },
  Medium: { color: '#D97706', bg: 'rgba(217,119,6,0.09)'   },
  Hard:   { color: '#E53E3E', bg: 'rgba(229,62,62,0.09)'   },
};

// ---------------------------------------------------------------------------
// Action Card
// ---------------------------------------------------------------------------

function ActionCard({ action, tracked, onToggle }) {
  const cat  = CATEGORY_META[action.category] ?? { label: action.category, icon: '🌱', color: T.primary };
  const diff = DIFFICULTY_META[action.difficulty] ?? { color: T.muted, bg: T.baseline };

  return (
    <div
      style={{
        background: tracked ? `rgba(26,107,60,0.04)` : '#fff',
        borderRadius: 16,
        padding: '1.125rem 1.25rem',
        border: tracked ? `1.5px solid rgba(26,107,60,0.22)` : '1px solid rgba(229,231,235,0.9)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}22`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Difficulty badge */}
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', padding: '0.18rem 0.55rem',
            borderRadius: 20, color: diff.color, background: diff.bg,
          }}>
            {action.difficulty}
          </span>
          {/* Category chip */}
          <span style={{
            fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.04em',
            padding: '0.18rem 0.5rem', borderRadius: 20,
            color: cat.color, background: `${cat.color}12`,
          }}>
            {cat.icon} {cat.label}
          </span>
        </div>

        {/* CO₂ saving pill */}
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
          padding: '0.2rem 0.6rem', borderRadius: 20,
          color: T.success, background: 'rgba(47,133,90,0.1)',
          flexShrink: 0,
        }}>
          −{action.co2SavedPerMonth.toFixed(1)} kg/mo
        </span>
      </div>

      {/* Title */}
      <p style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.45,
                  color: 'var(--color-text)', margin: 0 }}>
        {action.title}
      </p>

      {/* Description */}
      <p style={{ fontSize: '0.78rem', color: T.muted, lineHeight: 1.65, margin: 0 }}>
        {action.description}
      </p>

      {/* Ultra-thin divider + toggle */}
      <div style={{ borderTop: `1px solid ${T.baseline}`, paddingTop: 10,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.68rem', color: T.muted }}>
          {action.unit}
        </span>
        <button
          onClick={() => onToggle(action.id)}
          aria-pressed={tracked}
          aria-label={tracked ? `Remove "${action.title}" from your plan` : `Add "${action.title}" to your plan`}
          style={{
            minHeight: 32, padding: '0.25rem 0.875rem',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: '0.72rem', fontWeight: 700,
            background: tracked ? `${T.primary}18` : T.primary,
            color: tracked ? T.primary : '#fff',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.82'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          {tracked ? '✓ In my plan' : '+ Add to plan'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter pill button
// ---------------------------------------------------------------------------

function FilterPill({ label, active, onClick, color = T.primary }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        minHeight: 36, padding: '0.3rem 1rem',
        borderRadius: 20, border: 'none', cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: active ? 700 : 500,
        color: active ? '#fff' : T.muted,
        background: active ? color : 'rgba(229,231,235,0.7)',
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: active ? `0 2px 10px ${color}44` : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ActionLibrary() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [trackedIds, setTrackedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const toggleTracked = (id) => {
    setTrackedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return actionsData.filter((a) => {
      const catOk  = categoryFilter  === 'all' || a.category  === categoryFilter;
      const diffOk = difficultyFilter === 'all' || a.difficulty === difficultyFilter;
      const queryOk = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
      return catOk && diffOk && queryOk;
    });
  }, [categoryFilter, difficultyFilter, searchQuery]);

  const totalPotentialSaving = filtered
    .filter((a) => trackedIds.has(a.id))
    .reduce((sum, a) => sum + a.co2SavedPerMonth, 0);

  return (
    <section
      style={{ width: '100%', maxWidth: 1024, margin: '0 auto', padding: '2.5rem 1rem',
               display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
      aria-label="Action Library"
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: T.primary,
                     letterSpacing: '-0.03em', marginBottom: 4 }}>
          Action Library
        </h2>
        <p style={{ color: T.muted, fontSize: '0.9rem' }}>
          {actionsData.length} science-backed actions to reduce your carbon footprint.
          Add them to your personal plan.
        </p>
      </div>

      {/* Savings banner — shown when actions are tracked */}
      {trackedIds.size > 0 && (
        <div style={{
          padding: '0.875rem 1.25rem',
          borderRadius: 14,
          background: 'rgba(47,133,90,0.08)',
          border: '1px solid rgba(47,133,90,0.22)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8,
        }}
          role="status"
          aria-live="polite"
        >
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: T.success }}>
            🌱 Your plan: {trackedIds.size} action{trackedIds.size > 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: '0.85rem', color: T.success, fontWeight: 700 }}>
            Potential saving: −{totalPotentialSaving.toFixed(1)} kg CO₂e / month
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="search"
            placeholder="Search actions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Search actions"
            style={{
              width: '100%', maxWidth: 340,
              height: 44, padding: '0 1rem 0 2.5rem',
              borderRadius: 10,
              border: `1.5px solid ${searchFocused ? T.primary : T.baseline}`,
              background: '#fff', outline: 'none',
              boxShadow: searchFocused ? `0 0 0 3px rgba(26,107,60,0.08)` : 'none',
              fontSize: '0.85rem', fontFamily: 'Inter, sans-serif',
              color: 'var(--color-text)',
              transition: 'border-color 0.2s, box-shadow 0.25s',
            }}
          />
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.85rem', color: T.muted, pointerEvents: 'none',
          }}>🔍</span>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <FilterPill label="All Categories" active={categoryFilter === 'all'}
            onClick={() => setCategoryFilter('all')} />
          {Object.entries(CATEGORY_META).map(([key, m]) => (
            <FilterPill key={key} label={`${m.icon} ${m.label}`}
              active={categoryFilter === key} onClick={() => setCategoryFilter(key)}
              color={m.color} />
          ))}
        </div>

        {/* Difficulty filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <FilterPill label="All Difficulties" active={difficultyFilter === 'all'}
            onClick={() => setDifficultyFilter('all')} />
          {Object.entries(DIFFICULTY_META).map(([key, m]) => (
            <FilterPill key={key} label={key} active={difficultyFilter === key}
              onClick={() => setDifficultyFilter(key)} color={m.color} />
          ))}
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em',
                  textTransform: 'uppercase', color: T.muted }}>
        {filtered.length} action{filtered.length !== 1 ? 's' : ''} shown
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: T.muted }}>
          <p style={{ fontSize: '2rem' }}>🔍</p>
          <p style={{ marginTop: 8 }}>No actions match your filters. Try adjusting your search.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              tracked={trackedIds.has(action.id)}
              onToggle={toggleTracked}
            />
          ))}
        </div>
      )}
    </section>
  );
}
