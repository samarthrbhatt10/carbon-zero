/**
 * @component SocialShare
 * @description Carbon footprint social sharing widget.
 * Generates a beautifully styled plain-text share card AND a canvas snapshot.
 * Google I/O 2026 aesthetic — matte glass preview, thin progress bars.
 *
 * Dependencies: html2canvas (already installed)
 * Security: only user's own footprint data is referenced — no external input.
 */

import { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { gradeColor, gradeLabel } from '../utils/formatters.js';
import { BENCHMARKS } from '../services/carbonCalc.js';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const T = {
  primary:  '#1A6B3C',
  accent:   '#F5A623',
  muted:    '#6B7280',
  baseline: '#E5E7EB',
  glass:    'rgba(248,251,247,0.88)',
  success:  '#2F855A',
  danger:   '#E53E3E',
};

const CATEGORY_COLORS = {
  transport: '#1A6B3C',
  energy:    '#F5A623',
  diet:      '#2F855A',
  shopping:  '#E53E3E',
};

// ---------------------------------------------------------------------------
// Plain-text share content generator
// ---------------------------------------------------------------------------

function buildShareText(result) {
  const { totalMonthly, totalAnnualTonnes, grade, transport, energy, diet, shopping } = result;
  const vsIndia  = ((totalAnnualTonnes / BENCHMARKS.india_average_annual_tCO2e) * 100).toFixed(0);
  const vsParis  = totalAnnualTonnes <= BENCHMARKS.paris_target_annual_tCO2e
    ? `✅ ${(BENCHMARKS.paris_target_annual_tCO2e - totalAnnualTonnes).toFixed(2)}t below Paris target`
    : `⚠️ ${(totalAnnualTonnes - BENCHMARKS.paris_target_annual_tCO2e).toFixed(2)}t above Paris target`;

  return `🌱 My CarbonZero Score — Grade ${grade}

📊 Monthly Footprint: ${totalMonthly.toFixed(1)} kg CO₂e
📅 Annual Footprint:  ${totalAnnualTonnes.toFixed(2)} tonnes CO₂e

Category Breakdown:
  🚗 Transport:  ${transport.toFixed(1)} kg/mo
  ⚡ Energy:     ${energy.toFixed(1)} kg/mo
  🥗 Diet:       ${diet.toFixed(1)} kg/mo
  🛍️ Shopping:  ${shopping.toFixed(1)} kg/mo

📈 vs India Average: ${vsIndia}%
${vsParis}

Track and shrink your footprint at CarbonZero 🌍
#CarbonZero #ClimateAction #SustainableIndia`;
}

// ---------------------------------------------------------------------------
// Visual share card (rendered to canvas via html2canvas)
// ---------------------------------------------------------------------------

function ShareCard({ result, cardRef }) {
  const { totalMonthly, totalAnnualTonnes, grade, transport, energy, diet, shopping } = result;
  const grColor  = gradeColor(grade);
  const maxCat   = Math.max(transport, energy, diet, shopping, 1);

  const categories = [
    { label: 'Transport', val: transport,  color: CATEGORY_COLORS.transport, icon: '🚗' },
    { label: 'Energy',    val: energy,     color: CATEGORY_COLORS.energy,    icon: '⚡' },
    { label: 'Diet',      val: diet,       color: CATEGORY_COLORS.diet,      icon: '🥗' },
    { label: 'Shopping',  val: shopping,   color: CATEGORY_COLORS.shopping,  icon: '🛍️' },
  ];

  return (
    <div
      ref={cardRef}
      style={{
        width: 480,
        background: 'linear-gradient(135deg, #f0faf4 0%, #fafff8 50%, #f7fdf0 100%)',
        borderRadius: 24,
        padding: '2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
        border: '1px solid rgba(26,107,60,0.12)',
        boxShadow: '0 20px 60px rgba(26,107,60,0.15)',
      }}
      aria-hidden="true"
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.25rem' }}>🌱</span>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: T.primary, letterSpacing: '-0.02em' }}>
              CarbonZero
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: T.muted, letterSpacing: '0.04em', margin: 0 }}>
            My Carbon Footprint Report
          </p>
        </div>
        {/* Grade ring */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: `2.5px solid ${grColor}`,
          background: `${grColor}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 800, color: grColor,
          boxShadow: `0 0 0 5px ${grColor}10`,
        }}>
          {grade}
        </div>
      </div>

      {/* Big number */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem',
                    padding: '1.25rem', borderRadius: 16,
                    background: 'rgba(255,255,255,0.7)', border: `1px solid ${T.baseline}` }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>
          Monthly Carbon Footprint
        </p>
        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: T.primary,
                    letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
          {totalMonthly.toFixed(1)}
          <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: 4 }}>kg CO₂e</span>
        </p>
        <p style={{ fontSize: '0.78rem', color: T.muted, marginTop: 4, margin: '4px 0 0' }}>
          {totalAnnualTonnes.toFixed(2)} tonnes per year · {gradeLabel(grade)}
        </p>
      </div>

      {/* Category bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {categories.map(({ label, val, color, icon }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text, #111827)' }}>
                {icon} {label}
              </span>
              <span style={{ fontSize: '0.72rem', color: T.muted }}>{val.toFixed(1)} kg</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: T.baseline }}>
              <div style={{
                height: '100%', width: `${(val / maxCat) * 100}%`,
                borderRadius: 2, background: color,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Benchmark chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[
          {
            label: 'vs India Avg',
            value: `${((totalAnnualTonnes / BENCHMARKS.india_average_annual_tCO2e) * 100).toFixed(0)}%`,
            color: T.primary,
          },
          {
            label: 'vs Paris Target',
            value: totalAnnualTonnes <= BENCHMARKS.paris_target_annual_tCO2e ? '✅ Under' : '⚠️ Over',
            color: totalAnnualTonnes <= BENCHMARKS.paris_target_annual_tCO2e ? T.success : T.danger,
          },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '0.35rem 0.75rem', borderRadius: 20,
            background: `${color}10`, border: `1px solid ${color}30`,
            display: 'flex', flexDirection: 'column', gap: 1,
          }}>
            <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: T.muted, margin: 0 }}>
              {label}
            </p>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p style={{ fontSize: '0.65rem', color: T.muted, textAlign: 'center',
                  borderTop: `1px solid ${T.baseline}`, paddingTop: '0.75rem', margin: 0 }}>
        Track &amp; shrink your footprint · CarbonZero · #ClimateAction #SustainableIndia
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy share text to clipboard"
      style={{
        minHeight: 44, padding: '0.5rem 1.25rem',
        borderRadius: 10, border: `1px solid ${copied ? T.success : T.baseline}`,
        background: copied ? 'rgba(47,133,90,0.08)' : '#fff',
        cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
        color: copied ? T.success : T.muted,
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
      onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; } }}
      onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = T.baseline; e.currentTarget.style.color = T.muted; } }}
    >
      {copied ? '✓ Copied!' : '📋 Copy Text'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SocialShare({ result }) {
  const cardRef       = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded]   = useState(false);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,              // Retina quality
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link    = document.createElement('a');
      link.download = 'carbonzero-score.png';
      link.href     = canvas.toDataURL('image/png');
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Share card export failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  if (!result) {
    return (
      <section
        style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: '2.5rem 1rem' }}
        aria-label="Social Share"
      >
        <div style={{
          background: T.glass, backdropFilter: 'blur(16px)',
          borderRadius: 20, border: '1px solid rgba(229,231,235,0.65)',
          boxShadow: '0 4px 24px rgba(26,107,60,0.06)',
          padding: '3rem', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '2.5rem' }}>📣</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: T.primary, margin: 0 }}>
            Share Your Score
          </h3>
          <p style={{ fontSize: '0.85rem', color: T.muted, maxWidth: 320, lineHeight: 1.7 }}>
            Complete the Calculator first to generate your personalised share card and text.
          </p>
        </div>
      </section>
    );
  }

  const shareText = buildShareText(result);

  return (
    <section
      style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: '2.5rem 1rem',
               display: 'flex', flexDirection: 'column', gap: '1.75rem' }}
      aria-label="Social Share"
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: T.primary,
                     letterSpacing: '-0.03em', marginBottom: 4 }}>
          Share Your Score
        </h2>
        <p style={{ color: T.muted, fontSize: '0.9rem' }}>
          Download your score card or copy the text to share across platforms.
        </p>
      </div>

      {/* Card preview */}
      <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <ShareCard result={result} cardRef={cardRef} />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          aria-label="Download share card as PNG"
          style={{
            minHeight: 44, padding: '0.5rem 1.5rem',
            borderRadius: 10, border: 'none',
            background: downloading ? T.baseline : T.primary,
            color: downloading ? T.muted : '#fff',
            cursor: downloading ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem', fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            boxShadow: downloading ? 'none' : '0 4px 14px rgba(26,107,60,0.25)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
          onMouseEnter={(e) => { if (!downloading) { e.currentTarget.style.transform = 'translateY(-1px)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {downloading ? '⏳ Generating…' : downloaded ? '✓ Saved!' : '⬇ Download Card'}
        </button>

        <CopyButton text={shareText} />
      </div>

      {/* Plain-text preview */}
      <div style={{
        background: T.glass,
        backdropFilter: 'blur(16px)',
        borderRadius: 16,
        border: '1px solid rgba(229,231,235,0.65)',
        padding: '1.25rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
      }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: T.muted }}>
          Share Text Preview
        </p>
        <pre style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.8rem', lineHeight: 1.75, color: T.text,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
        }}>
          {shareText}
        </pre>
      </div>

      {/* Platform hints */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { icon: '🐦', label: 'Twitter/X' },
          { icon: '💼', label: 'LinkedIn'  },
          { icon: '📸', label: 'Instagram' },
          { icon: '💬', label: 'WhatsApp'  },
        ].map(({ icon, label }) => (
          <div key={label} style={{
            padding: '0.3rem 0.75rem', borderRadius: 20,
            border: `1px solid ${T.baseline}`, background: '#fff',
            fontSize: '0.72rem', color: T.muted, fontWeight: 500,
          }}>
            {icon} {label}
          </div>
        ))}
      </div>
    </section>
  );
}
