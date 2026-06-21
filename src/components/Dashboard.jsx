/**
 * @component Dashboard
 * @description Carbon footprint dashboard — Google I/O 2026 minimal aesthetic.
 *
 * UI changes from v1:
 *   - Borderless matte glass panels (backdrop-filter blur, no hard card borders)
 *   - Chart.js: easeOutQuart easing, 1200ms duration on both donut and line charts
 *   - Benchmark rows: ultra-thin 2px single-line progress indicators with smooth CSS transition
 *   - KPI cards: floating borderless tiles with ambient green glow on hover
 *   - Grade widget: large centered typographic treatment
 *   - Category chips: pill-shaped, no top border accent
 *
 * Chart.js modules registered once at module level.
 */

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

import { BENCHMARKS } from '../services/carbonCalc.js';
import { gradeColor, gradeLabel } from '../utils/formatters.js';

ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const T = {
  primary:   '#1A6B3C',
  accent:    '#F5A623',
  muted:     '#6B7280',
  baseline:  '#E5E7EB',
  glass:     'rgba(248,251,247,0.82)',
  glassHover:'rgba(248,251,247,0.96)',
  danger:    '#E53E3E',
  success:   '#2F855A',
};

const CATEGORY_COLORS = {
  transport: '#1A6B3C',
  energy:    '#F5A623',
  diet:      '#2F855A',
  shopping:  '#E53E3E',
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ---------------------------------------------------------------------------
// Shared easing for all Chart.js animations
// ---------------------------------------------------------------------------

const CHART_ANIMATION = {
  duration: 1200,
  easing:   'easeOutQuart',
};

// ---------------------------------------------------------------------------
// Mock trend generator
// ---------------------------------------------------------------------------

function generateMockTrend(currentMonthly) {
  const now          = new Date();
  const currentMonth = now.getMonth();
  const baseStart    = Math.max(currentMonthly * 1.35, 280);
  return Array.from({ length: 12 }, (_, i) => {
    if (i > currentMonth)  return null;
    if (i === currentMonth) return Math.round(currentMonthly * 10) / 10;
    const progress = i / Math.max(currentMonth, 1);
    const noise    = Math.sin(i * 7.3) * 15;
    return Math.round((baseStart - (baseStart - currentMonthly) * progress + noise) * 10) / 10;
  });
}

// ---------------------------------------------------------------------------
// Matte glass panel wrapper
// ---------------------------------------------------------------------------

function GlassPanel({ children, style = {}, ...props }) {
  return (
    <div
      {...props}
      style={{
        background: T.glass,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 20,
        border: '1px solid rgba(229,231,235,0.65)',
        boxShadow: '0 4px 24px rgba(26,107,60,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        padding: '1.5rem',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI floating tile
// ---------------------------------------------------------------------------

function KpiTile({ label, value, subtext, color, icon }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '1.125rem 1.25rem',
        display: 'flex', flexDirection: 'column', gap: 4,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid rgba(229,231,235,0.8)',
        transition: 'box-shadow 0.25s, transform 0.25s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 28px rgba(26,107,60,0.13)`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em',
                    textTransform: 'uppercase', color: T.muted }}>
          {label}
        </p>
        <span style={{ fontSize: '1.1rem' }} aria-hidden="true">{icon}</span>
      </div>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {value}
      </p>
      {subtext && (
        <p style={{ fontSize: '0.72rem', color: T.muted }}>{subtext}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ultra-thin benchmark row
// ---------------------------------------------------------------------------

function BenchmarkRow({ label, userTonnes, targetTonnes, color, icon }) {
  const isUnder = userTonnes <= targetTonnes;
  // Fill width: 0 % = 0t, 100 % = 2× target (capped)
  const fillPct = Math.min((userTonnes / (targetTonnes * 2)) * 100, 100);
  // Midpoint marker sits at exactly 50% of the track (= the target)
  const overageText = isUnder
    ? `${(targetTonnes - userTonnes).toFixed(2)}t under`
    : `+${(userTonnes - targetTonnes).toFixed(2)}t over`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true" style={{ fontSize: '0.9rem' }}>{icon}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text)' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {userTonnes.toFixed(2)}t
          </span>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700,
            padding: '0.15rem 0.5rem',
            borderRadius: 20,
            background: isUnder ? 'rgba(47,133,90,0.1)' : 'rgba(229,62,62,0.09)',
            color: isUnder ? T.success : T.danger,
          }}>
            {overageText}
          </span>
        </div>
      </div>

      {/* Ultra-thin 2px progress track */}
      <div style={{
        position: 'relative',
        height: 2,
        borderRadius: 1,
        background: T.baseline,
        overflow: 'visible',
      }}>
        {/* Fill */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, height: '100%',
          width: `${fillPct}%`,
          borderRadius: 1,
          background: isUnder ? color : T.danger,
          transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
        }} />
        {/* Target tick — a thin vertical line at the 50% midpoint */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: -4,
          width: 1.5,
          height: 10,
          borderRadius: 1,
          background: 'rgba(107,114,128,0.5)',
          transform: 'translateX(-50%)',
        }}
          title={`Target: ${targetTonnes}t`}
        />
      </div>

      {/* Bottom row: target label */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.68rem', color: T.muted }}>0t</span>
        <span style={{ fontSize: '0.68rem', color: T.muted }}>target: {targetTonnes}t</span>
        <span style={{ fontSize: '0.68rem', color: T.muted }}>{(targetTonnes * 2).toFixed(1)}t</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grade widget — typographic centrepiece
// ---------------------------------------------------------------------------

function GradeWidget({ grade, annualTonnes }) {
  const color = gradeColor(grade);
  const label = gradeLabel(grade);

  return (
    <GlassPanel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}
      role="region" aria-label={`Your grade: ${grade}`}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: T.muted }}>
        Annual Grade
      </p>

      {/* Large grade circle */}
      <div style={{
        width: 88, height: 88,
        borderRadius: '50%',
        background: `${color}16`,
        border: `2.5px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem', fontWeight: 800, color,
        boxShadow: `0 0 0 6px ${color}09`,
        transition: 'all 0.4s',
      }}
        aria-label={`Grade ${grade}`}
      >
        {grade}
      </div>

      <div>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color, lineHeight: 1.4 }}>{label}</p>
        <p style={{ fontSize: '0.72rem', color: T.muted, marginTop: 2 }}>
          {annualTonnes.toFixed(2)} t CO₂e / year
        </p>
      </div>

      {/* Micro grade scale */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} aria-hidden="true">
        {['A','B','C','D','E','F'].map((g) => (
          <div key={g} style={{
            width: g === grade ? 28 : 22,
            height: g === grade ? 28 : 22,
            borderRadius: '50%',
            background: gradeColor(g),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: g === grade ? '0.72rem' : '0.62rem',
            fontWeight: 700, color: '#fff',
            opacity: g === grade ? 1 : 0.28,
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: g === grade ? `0 2px 8px ${gradeColor(g)}60` : 'none',
          }}>
            {g}
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// ---------------------------------------------------------------------------
// Chart.js data hooks — easeOutQuart + 1200ms
// ---------------------------------------------------------------------------

function useDoughnutData(result) {
  return useMemo(() => {
    if (!result) return null;
    const vals  = [result.transport, result.energy, result.diet, result.shopping];
    const total = vals.reduce((a, b) => a + b, 0);

    return {
      data: {
        labels: ['Transport', 'Energy', 'Diet', 'Shopping'],
        datasets: [{
          data: vals,
          backgroundColor: [
            CATEGORY_COLORS.transport,
            CATEGORY_COLORS.energy,
            CATEGORY_COLORS.diet,
            CATEGORY_COLORS.shopping,
          ],
          borderColor: 'rgba(248,251,247,0.85)',
          borderWidth: 3,
          hoverOffset: 10,
          hoverBorderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 18,
              font: { family: 'Inter', size: 11.5, weight: '500' },
              color: '#4B5563',
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.97)',
            borderColor: T.baseline,
            borderWidth: 1,
            titleColor: '#111827',
            bodyColor: '#4B5563',
            cornerRadius: 10,
            padding: 10,
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return `  ${ctx.label}: ${val.toFixed(1)} kg  (${pct}%)`;
              },
            },
            bodyFont: { family: 'Inter' },
            titleFont: { family: 'Inter', weight: '600' },
          },
        },
        animation: { ...CHART_ANIMATION, animateScale: true, animateRotate: true },
      },
      total,
    };
  }, [result]);
}

function useTrendData(result) {
  return useMemo(() => {
    if (!result) return null;
    const trendValues = generateMockTrend(result.totalMonthly);
    const nowIdx      = new Date().getMonth();

    return {
      data: {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: 'Your Monthly Footprint',
            data: trendValues,
            borderColor: T.primary,
            backgroundColor: 'rgba(26,107,60,0.06)',
            borderWidth: 2,
            pointRadius: trendValues.map((_, i) => i === nowIdx ? 6 : 2.5),
            pointBackgroundColor: trendValues.map((_, i) => i === nowIdx ? T.primary : 'rgba(26,107,60,0.5)'),
            pointBorderColor: '#fff',
            pointBorderWidth: trendValues.map((_, i) => i === nowIdx ? 2 : 0),
            pointHoverRadius: 8,
            fill: true,
            tension: 0.42,
            spanGaps: false,
          },
          {
            label: `Paris Target (${Math.round(BENCHMARKS.paris_target_annual_tCO2e * 1000 / 12)} kg/mo)`,
            data: MONTH_LABELS.map(() => Math.round(BENCHMARKS.paris_target_annual_tCO2e * 1000 / 12)),
            borderColor: 'rgba(107,114,128,0.5)',
            borderWidth: 1,
            borderDash: [5, 4],
            pointRadius: 0,
            fill: false,
            tension: 0,
          },
          {
            label: `India Avg (${Math.round(BENCHMARKS.india_average_annual_tCO2e * 1000 / 12)} kg/mo)`,
            data: MONTH_LABELS.map(() => Math.round(BENCHMARKS.india_average_annual_tCO2e * 1000 / 12)),
            borderColor: 'rgba(245,166,35,0.6)',
            borderWidth: 1,
            borderDash: [3, 4],
            pointRadius: 0,
            fill: false,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#9CA3AF' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(229,231,235,0.7)', lineWidth: 1 },
            border: { display: false, dash: [4, 4] },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#9CA3AF',
              callback: (v) => `${v} kg`,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              padding: 16,
              font: { family: 'Inter', size: 11 },
              color: '#6B7280',
              usePointStyle: true,
              pointStyleWidth: 8,
              boxHeight: 6,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.97)',
            borderColor: T.baseline,
            borderWidth: 1,
            titleColor: '#111827',
            bodyColor: '#4B5563',
            cornerRadius: 10,
            padding: 10,
            callbacks: {
              label: (ctx) => `  ${ctx.dataset.label.split('(')[0].trim()}: ${ctx.parsed.y} kg`,
            },
            bodyFont: { family: 'Inter' },
            titleFont: { family: 'Inter', weight: '600' },
          },
        },
        animation: CHART_ANIMATION,
      },
    };
  }, [result]);
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyDashboard() {
  return (
    <section style={{ width: '100%', maxWidth: 1024, margin: '0 auto', padding: '3rem 1rem' }}
      aria-label="Dashboard">
      <GlassPanel style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex',
                           flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '3.5rem' }} aria-hidden="true">📊</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: T.primary, letterSpacing: '-0.02em' }}>
          Your Dashboard Awaits
        </h2>
        <p style={{ color: T.muted, maxWidth: 400, lineHeight: 1.7, fontSize: '0.9rem' }}>
          Complete the Carbon Footprint Calculator to unlock personalised charts, AI coaching, and benchmark comparisons.
        </p>
      </GlassPanel>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard({ result }) {
  const doughnut = useDoughnutData(result);
  const trend    = useTrendData(result);

  if (!result) return <EmptyDashboard />;

  const annualTonnes = result.totalAnnualTonnes;
  const topCategory  = Object.entries({
    Transport: result.transport, Energy: result.energy,
    Diet: result.diet, Shopping: result.shopping,
  }).sort((a, b) => b[1] - a[1])[0][0];

  return (
    <section
      style={{ width: '100%', maxWidth: 1024, margin: '0 auto', padding: '2.5rem 1rem',
               display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      aria-label="Carbon Footprint Dashboard"
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: T.primary,
                     letterSpacing: '-0.03em', marginBottom: 4 }}>
          Your Dashboard
        </h2>
        <p style={{ color: T.muted, fontSize: '0.9rem' }}>
          Your carbon footprint at a glance — plus how you compare to global benchmarks.
        </p>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }}
           className="sm:grid-cols-4">
        <KpiTile
          label="Monthly Total"
          value={`${result.totalMonthly.toFixed(1)} kg`}
          subtext="CO₂e this month"
          color={T.primary} icon="📅"
        />
        <KpiTile
          label="Annual Total"
          value={`${annualTonnes.toFixed(2)}t`}
          subtext="tonnes CO₂e / year"
          color="#2D9156" icon="📆"
        />
        <KpiTile
          label="Top Category"
          value={topCategory}
          subtext="Biggest emissions source"
          color={T.accent} icon="🔍"
        />
        <KpiTile
          label="vs Paris Target"
          value={annualTonnes <= BENCHMARKS.paris_target_annual_tCO2e
            ? `−${(BENCHMARKS.paris_target_annual_tCO2e - annualTonnes).toFixed(2)}t`
            : `+${(annualTonnes - BENCHMARKS.paris_target_annual_tCO2e).toFixed(2)}t`}
          subtext={annualTonnes <= BENCHMARKS.paris_target_annual_tCO2e ? 'Below target 🎉' : 'Above 2.3t target'}
          color={annualTonnes <= BENCHMARKS.paris_target_annual_tCO2e ? T.success : T.danger}
          icon={annualTonnes <= BENCHMARKS.paris_target_annual_tCO2e ? '✅' : '⚠️'}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}
           className="lg:grid-cols-[280px_1fr]">

        {/* Donut */}
        <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                       textTransform: 'uppercase', color: T.muted }}>
            Category Breakdown
          </h3>
          <div style={{ maxWidth: 240, margin: '0 auto', width: '100%' }}>
            {doughnut && (
              <Doughnut
                data={doughnut.data}
                options={doughnut.options}
                aria-label="Donut chart showing carbon footprint by category"
                role="img"
              />
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.68rem', color: T.muted }}>Total</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: T.primary,
                        letterSpacing: '-0.02em' }}>
              {result.totalMonthly.toFixed(1)} kg CO₂e
            </p>
          </div>
        </GlassPanel>

        {/* Line chart */}
        <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                       textTransform: 'uppercase', color: T.muted }}>
            Monthly Trend
          </h3>
          <div style={{ position: 'relative', height: 220 }}>
            {trend && (
              <Line
                data={trend.data}
                options={trend.options}
                aria-label="Line chart showing monthly carbon footprint trend vs benchmarks"
                role="img"
              />
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Benchmarks + Grade */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}
           className="lg:grid-cols-[1fr_260px]">

        {/* Benchmark panel */}
        <GlassPanel style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                       textTransform: 'uppercase', color: T.muted }}>
            How Do You Compare?
          </h3>

          <BenchmarkRow
            label="Paris Agreement Target"
            userTonnes={annualTonnes}
            targetTonnes={BENCHMARKS.paris_target_annual_tCO2e}
            color={T.success} icon="🎯"
          />
          <BenchmarkRow
            label="India National Average"
            userTonnes={annualTonnes}
            targetTonnes={BENCHMARKS.india_average_annual_tCO2e}
            color={T.primary} icon="🇮🇳"
          />
          <BenchmarkRow
            label="Global Average"
            userTonnes={annualTonnes}
            targetTonnes={BENCHMARKS.global_average_annual_tCO2e}
            color={T.accent} icon="🌐"
          />

          <p style={{ fontSize: '0.7rem', color: T.muted, borderTop: `1px solid ${T.baseline}`,
                      paddingTop: '1rem', lineHeight: 1.6 }}>
            Sources: IPCC AR6 (2022), India CEA 2023, Our World in Data.
            Paris target = 2.3t CO₂e / person / year to limit warming to 1.5°C.
          </p>
        </GlassPanel>

        {/* Grade widget */}
        <GradeWidget grade={result.grade} annualTonnes={annualTonnes} />
      </div>

      {/* Category pills row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }}
           className="sm:grid-cols-4">
        {[
          { key: 'transport', label: 'Transport', icon: '🚗', val: result.transport  },
          { key: 'energy',    label: 'Energy',    icon: '⚡', val: result.energy     },
          { key: 'diet',      label: 'Diet',      icon: '🥗', val: result.diet       },
          { key: 'shopping',  label: 'Shopping',  icon: '🛍️', val: result.shopping   },
        ].map(({ key, label, icon, val }) => {
          const pct = result.totalMonthly > 0 ? ((val / result.totalMonthly) * 100).toFixed(0) : 0;
          const clr = CATEGORY_COLORS[key];
          return (
            <div
              key={key}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '1rem 1.125rem',
                border: '1px solid rgba(229,231,235,0.8)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column', gap: 6,
                transition: 'box-shadow 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 6px 20px ${clr}25`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem' }} aria-hidden="true">{icon}</span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  padding: '0.15rem 0.5rem', borderRadius: 20,
                  background: `${clr}14`, color: clr,
                }}>
                  {pct}%
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)' }}>{label}</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: clr, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {val.toFixed(1)}
              </p>
              <p style={{ fontSize: '0.68rem', color: T.muted }}>kg CO₂e / month</p>

              {/* Micro bar */}
              <div style={{ height: 2, borderRadius: 1, background: T.baseline, marginTop: 2 }}>
                <div style={{
                  height: '100%', width: `${pct}%`, borderRadius: 1, background: clr,
                  transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
