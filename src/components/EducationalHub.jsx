/**
 * @component EducationalHub
 * @description 6-article climate literacy hub with Inter typography, reading progress bar,
 * and a minimal list → reader view pattern.
 * Google I/O 2026 aesthetic — off-white canvas, matte glass reader, thin progress bar.
 *
 * Data: src/data/articles.json
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import articlesData from '../data/articles.json';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const T = {
  primary:  '#1A6B3C',
  accent:   '#F5A623',
  muted:    '#6B7280',
  baseline: '#E5E7EB',
  glass:    'rgba(248,251,247,0.9)',
  text:     '#111827',
};

const CATEGORY_COLORS = {
  Science:  '#7C3AED',
  India:    '#1A6B3C',
  Policy:   '#D97706',
  Technology:'#0EA5E9',
  Energy:   '#F5A623',
  Diet:     '#2F855A',
};

// ---------------------------------------------------------------------------
// Reading progress bar (pinned at top of the reader)
// ---------------------------------------------------------------------------

function ReadingProgress({ containerRef }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      setProgress(max > 0 ? Math.min((scrollTop / max) * 100, 100) : 0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef]);

  return (
    <div style={{
      position: 'sticky', top: 0, left: 0, right: 0,
      height: 2, background: T.baseline, zIndex: 10,
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: `linear-gradient(90deg, ${T.primary}, ${T.accent})`,
        borderRadius: 1,
        transition: 'width 0.1s linear',
      }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown-ish renderer — converts our article content to styled JSX
// Supports: ## headings, **bold**, | table rows, and - lists
// ---------------------------------------------------------------------------

function ArticleContent({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ## Heading
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{
          fontSize: '1.2rem', fontWeight: 700, color: T.primary,
          letterSpacing: '-0.02em', marginTop: '2rem', marginBottom: '0.5rem',
          lineHeight: 1.3,
        }}>
          {line.replace('## ', '')}
        </h2>
      );
      i++; continue;
    }

    // | Table row
    if (line.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines.filter((l) => !l.match(/^\|[-| ]+\|$/));
      elements.push(
        <div key={`table-${i}`} style={{ overflowX: 'auto', marginTop: '1rem', marginBottom: '1rem' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem',
          }}>
            <tbody>
              {rows.map((row, ri) => {
                const cells = row.split('|').filter((c) => c.trim() !== '');
                const isHeader = ri === 0;
                return (
                  <tr key={ri} style={{ borderBottom: `1px solid ${T.baseline}` }}>
                    {cells.map((cell, ci) => {
                      const Tag = isHeader ? 'th' : 'td';
                      return (
                        <Tag key={ci} style={{
                          padding: '0.45rem 0.75rem',
                          textAlign: 'left',
                          fontWeight: isHeader ? 700 : 400,
                          color: isHeader ? T.primary : T.text,
                          background: isHeader ? 'rgba(26,107,60,0.05)' : 'transparent',
                          fontSize: isHeader ? '0.72rem' : '0.82rem',
                          letterSpacing: isHeader ? '0.04em' : 0,
                          textTransform: isHeader ? 'uppercase' : 'none',
                        }}>
                          {renderInline(cell.trim())}
                        </Tag>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // - List item
    if (line.startsWith('- ')) {
      const listLines = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        listLines.push(lines[i].replace('- ', ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '0.5rem 0 1rem 0', paddingLeft: '1rem',
                                      display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {listLines.map((item, li) => (
            <li key={li} style={{
              fontSize: '0.875rem', lineHeight: 1.75, color: T.text,
              listStyleType: 'none', paddingLeft: '0.5rem',
              borderLeft: `2px solid ${T.baseline}`,
            }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      elements.push(
        <p key={i} style={{
          fontSize: '0.9rem', lineHeight: 1.85, color: T.text,
          margin: '0.5rem 0',
        }}>
          {renderInline(line)}
        </p>
      );
    }

    i++;
  }

  return <>{elements}</>;
}

/** Inline formatter: **bold** and *italic* */
function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: T.text }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ---------------------------------------------------------------------------
// Article card (list view)
// ---------------------------------------------------------------------------

function ArticleCard({ article, onClick }) {
  const catColor = CATEGORY_COLORS[article.category] ?? T.primary;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        background: '#fff',
        borderRadius: 16,
        padding: '1.25rem 1.375rem',
        border: '1px solid rgba(229,231,235,0.9)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        cursor: 'pointer', outline: 'none',
        display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: 'Inter, sans-serif',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 24px ${catColor}22`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px rgba(26,107,60,0.12)`; }}
      onBlur={(e)  => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; }}
      aria-label={`Read article: ${article.title}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase', padding: '0.2rem 0.6rem',
          borderRadius: 20, color: catColor, background: `${catColor}12`,
        }}>
          {article.category}
        </span>
        <span style={{ fontSize: '0.7rem', color: T.muted }}>
          {article.readingTimeMinutes} min read
        </span>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: T.text,
                   letterSpacing: '-0.01em', lineHeight: 1.35, margin: 0 }}>
        {article.title}
      </h3>

      <p style={{ fontSize: '0.82rem', color: T.muted, lineHeight: 1.6, margin: 0 }}>
        {article.subtitle}
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {article.tags.slice(0, 4).map((tag) => (
          <span key={tag} style={{
            fontSize: '0.62rem', padding: '0.15rem 0.5rem',
            borderRadius: 20, background: T.baseline, color: T.muted, fontWeight: 500,
          }}>
            #{tag}
          </span>
        ))}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Reader view
// ---------------------------------------------------------------------------

function ArticleReader({ article, onBack }) {
  const containerRef = useRef(null);
  const catColor     = CATEGORY_COLORS[article.category] ?? T.primary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start', minHeight: 36, padding: '0.25rem 0.875rem',
          borderRadius: 8, border: `1px solid ${T.baseline}`,
          background: 'transparent', cursor: 'pointer',
          fontSize: '0.78rem', fontWeight: 600, color: T.muted,
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.baseline; e.currentTarget.style.color = T.muted; }}
        aria-label="Back to article list"
      >
        ← All Articles
      </button>

      {/* Reader panel */}
      <div
        ref={containerRef}
        style={{
          background: T.glass,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 20,
          border: '1px solid rgba(229,231,235,0.65)',
          boxShadow: '0 4px 32px rgba(26,107,60,0.07)',
          overflow: 'auto',
          maxHeight: 'calc(100vh - 220px)',
          position: 'relative',
        }}
      >
        <ReadingProgress containerRef={containerRef} />

        <div style={{ padding: '2rem 2.5rem', maxWidth: 720, margin: '0 auto' }}>
          {/* Article meta */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.07em',
              textTransform: 'uppercase', padding: '0.2rem 0.6rem',
              borderRadius: 20, color: catColor, background: `${catColor}12`,
            }}>
              {article.category}
            </span>
            <span style={{ fontSize: '0.7rem', color: T.muted }}>
              {article.readingTimeMinutes} min read
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: T.text,
                       letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            {article.title}
          </h1>
          <p style={{ fontSize: '1rem', color: T.muted, lineHeight: 1.6, marginBottom: '2rem',
                      fontStyle: 'italic' }}>
            {article.subtitle}
          </p>

          {/* Ultra-thin divider */}
          <div style={{ height: 1, background: T.baseline, marginBottom: '1.5rem' }} />

          {/* Article body */}
          <ArticleContent content={article.content} />

          {/* Citation footer */}
          <div style={{
            marginTop: '2.5rem', paddingTop: '1rem',
            borderTop: `1px solid ${T.baseline}`,
          }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>
              Sources &amp; Citations
            </p>
            <p style={{ fontSize: '0.72rem', color: T.muted, lineHeight: 1.7 }}>
              IPCC Sixth Assessment Report (AR6), 2022 · UK DEFRA GHG Conversion Factors 2023 ·
              India CEA CO₂ Baseline Database v19 (2023) · World Bank Open Data ·
              Our World in Data (2023) · FAO GLEAM (2013) · Poore &amp; Nemecek, Science (2018)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function EducationalHub() {
  const [activeArticle, setActiveArticle] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', ...new Set(articlesData.map((a) => a.category))];

  const filtered = categoryFilter === 'all'
    ? articlesData
    : articlesData.filter((a) => a.category === categoryFilter);

  if (activeArticle) {
    return (
      <section
        style={{ width: '100%', maxWidth: 1024, margin: '0 auto', padding: '2.5rem 1rem' }}
        aria-label={`Reading: ${activeArticle.title}`}
      >
        <ArticleReader article={activeArticle} onBack={() => setActiveArticle(null)} />
      </section>
    );
  }

  return (
    <section
      style={{ width: '100%', maxWidth: 1024, margin: '0 auto', padding: '2.5rem 1rem',
               display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
      aria-label="Educational Hub"
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: T.primary,
                     letterSpacing: '-0.03em', marginBottom: 4 }}>
          Educational Hub
        </h2>
        <p style={{ color: T.muted, fontSize: '0.9rem' }}>
          {articlesData.length} deep-dive articles on climate science, India's carbon landscape, and sustainable living.
        </p>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {categories.map((cat) => {
          const color = cat === 'all' ? T.primary : (CATEGORY_COLORS[cat] ?? T.primary);
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              aria-pressed={active}
              style={{
                minHeight: 36, padding: '0.3rem 0.875rem',
                borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: active ? 700 : 500,
                color: active ? '#fff' : T.muted,
                background: active ? color : 'rgba(229,231,235,0.7)',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: active ? `0 2px 10px ${color}44` : 'none',
                textTransform: cat === 'all' ? 'none' : 'none',
              }}
            >
              {cat === 'all' ? 'All Topics' : cat}
            </button>
          );
        })}
      </div>

      {/* Article grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filtered.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onClick={() => setActiveArticle(article)}
          />
        ))}
      </div>
    </section>
  );
}
