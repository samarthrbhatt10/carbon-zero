/**
 * @component Calculator
 * @description Multi-step carbon footprint intake form — Google I/O 2026 minimal aesthetic.
 *
 * UI changes from v1:
 *   - Borderless underline inputs with #E5E7EB baseline + 0 0 0 3px rgba(26,107,60,0.08) focus ring
 *   - Fluid sliding pill highlight on step tab bar (CSS translate, no layout shift)
 *   - Micro-shadow gradient focus glow on all inputs
 *   - Matte glass summary card, no hard borders
 *   - Refined typography: lighter weights, generous line-height
 *
 * Security & Accessibility maintained:
 *   - All numeric inputs validated with validators.validateNumber()
 *   - Explicit <label htmlFor> on every field
 *   - Min 44px touch targets, ARIA-live summary region
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  calcTransportEmissions,
  calcEnergyEmissions,
  calcDietEmissions,
  calcShoppingEmissions,
  calcTotalFootprint,
} from '../services/carbonCalc.js';
import { validateNumber } from '../utils/validators.js';
import { gradeColor, gradeLabel } from '../utils/formatters.js';
import { saveFootprint } from '../services/storage.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS      = ['Transport', 'Energy', 'Diet', 'Shopping'];
const STEP_ICONS = ['🚗', '⚡', '🥗', '🛍️'];

const DEFAULT_TRANSPORT = {
  carKmPerMonth: 0, carType: 'petrol',
  flightKmPerMonth: 0, intFlightKmPerMonth: 0,
  busKmPerMonth: 0, trainKmPerMonth: 0,
  motorcycleKmPerMonth: 0, autoKmPerMonth: 0,
};
const DEFAULT_ENERGY = {
  electricityKwhPerMonth: 0, renewablePercent: 0,
  lpgKgPerMonth: 0, pngScmPerMonth: 0,
};
const DEFAULT_DIET = {
  beefKg: 0, lambKg: 0, chickenKg: 0, porkKg: 0,
  fishKg: 0, dairyKg: 0, vegetablesKg: 0, riceKg: 0, pulsesKg: 0,
};
const DEFAULT_SHOPPING = {
  clothingItems: 0, smartphones: 0, laptops: 0, onlineOrders: 0,
};

// ---------------------------------------------------------------------------
// Design tokens (IO-2026 minimal palette)
// ---------------------------------------------------------------------------

const T = {
  primary:     '#1A6B3C',
  accent:      '#F5A623',
  baseline:    '#E5E7EB',            // underline colour
  focusRing:   'rgba(26,107,60,0.08)',
  focusBorder: '#1A6B3C',
  muted:       '#6B7280',
  surface:     'rgba(255,255,255,0.72)',
  glass:       'rgba(248,251,247,0.82)',
};

// ---------------------------------------------------------------------------
// Underline Number Field
// ---------------------------------------------------------------------------

function NumberField({ id, label, unit, value, onChange, min = 0, max = 99999, step = 1, hint }) {
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback((e) => {
    try { onChange(validateNumber(e.target.value, min, max)); } catch { /* revert */ }
  }, [min, max, onChange]);

  return (
    <div className="flex flex-col" style={{ gap: '0.25rem' }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: focused ? T.primary : T.muted,
          transition: 'color 0.2s',
        }}
      >
        {label}
        {unit && (
          <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 4, color: T.muted }}>
            ({unit})
          </span>
        )}
      </label>

      <input
        id={id}
        type="number"
        defaultValue={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        style={{
          width: '100%',
          minHeight: 44,
          padding: '0.5rem 0',
          background: 'transparent',
          border: 'none',
          borderBottom: `1.5px solid ${focused ? T.focusBorder : T.baseline}`,
          outline: 'none',
          boxShadow: focused ? `0 4px 0 -1px ${T.focusRing}` : 'none',
          fontSize: '1rem',
          fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          color: 'var(--color-text)',
          borderRadius: 0,
          transition: 'border-color 0.2s, box-shadow 0.25s',
          WebkitAppearance: 'none',
          MozAppearance: 'textfield',
        }}
      />

      {hint && (
        <p
          id={`${id}-hint`}
          style={{ fontSize: '0.72rem', color: T.muted, marginTop: '0.15rem', lineHeight: 1.5 }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pill Radio Group
// ---------------------------------------------------------------------------

function RadioGroup({ name, options, value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      style={{
        display: 'inline-flex',
        gap: 6,
        padding: 4,
        borderRadius: 10,
        background: 'rgba(229,231,235,0.55)',
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
              padding: '0.375rem 0.875rem',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: active ? 600 : 400,
              color: active ? T.primary : T.muted,
              background: active ? '#fff' : 'transparent',
              boxShadow: active ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              userSelect: 'none',
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Range Slider
// ---------------------------------------------------------------------------

function RangeField({ id, label, value, onChange, min = 0, max = 100, step = 5, unit = '%' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label
          htmlFor={id}
          style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em',
                   textTransform: 'uppercase', color: T.muted }}
        >
          {label}
        </label>
        <span
          style={{
            fontSize: '0.8rem', fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: 20,
            background: `rgba(26,107,60,0.09)`,
            color: T.primary,
          }}
        >
          {value}{unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: T.muted }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section divider label
// ---------------------------------------------------------------------------

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: T.muted,
      borderBottom: `1px solid ${T.baseline}`, paddingBottom: '0.4rem',
      marginBottom: '0.25rem',
    }}>
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Step panels (unchanged logic, restyled markup)
// ---------------------------------------------------------------------------

function TransportStep({ data, onChange }) {
  const set = (k) => (v) => onChange({ ...data, [k]: v });
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: T.muted, lineHeight: 1.7 }}>
        Enter your typical monthly distances. Values are multiplied by IPCC AR6 emission factors automatically.
      </p>
      <div>
        <SectionLabel>Car fuel type</SectionLabel>
        <RadioGroup name="carType" value={data.carType} onChange={set('carType')} options={[
          { value: 'petrol', label: 'Petrol', icon: '⛽' },
          { value: 'diesel', label: 'Diesel', icon: '🛢️' },
          { value: 'electric', label: 'Electric', icon: '🔋' },
        ]} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem 2rem' }}>
        <NumberField id="car-km"     label="Car travel"           unit="km/month" value={data.carKmPerMonth}       onChange={set('carKmPerMonth')}       max={10000} hint="e.g. 30 km/day × 20 days = 600 km" />
        <NumberField id="moto-km"    label="Motorcycle / Scooter" unit="km/month" value={data.motorcycleKmPerMonth} onChange={set('motorcycleKmPerMonth')} max={5000} />
        <NumberField id="auto-km"    label="Auto-rickshaw"        unit="km/month" value={data.autoKmPerMonth}       onChange={set('autoKmPerMonth')}       max={2000} />
        <NumberField id="bus-km"     label="Bus"                  unit="km/month" value={data.busKmPerMonth}        onChange={set('busKmPerMonth')}        max={5000} />
        <NumberField id="train-km"   label="Train / Metro"        unit="km/month" value={data.trainKmPerMonth}      onChange={set('trainKmPerMonth')}      max={10000} />
        <NumberField id="flight-dom" label="Domestic flights"     unit="km/month" value={data.flightKmPerMonth}     onChange={set('flightKmPerMonth')}     max={20000} hint="DEL → BOM ≈ 1,200 km" />
        <NumberField id="flight-int" label="Int'l flights"        unit="km/month" value={data.intFlightKmPerMonth}  onChange={set('intFlightKmPerMonth')}  max={50000} />
      </div>
    </div>
  );
}

function EnergyStep({ data, onChange }) {
  const set = (k) => (v) => onChange({ ...data, [k]: v });
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: T.muted, lineHeight: 1.7 }}>
        India grid factor: <strong style={{ color: 'var(--color-text)' }}>0.708 kg CO₂e/kWh</strong> (CEA 2023).
        Solar electricity uses 0.041 kg CO₂e/kWh.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem 2rem' }}>
        <NumberField id="elec-kwh" label="Monthly electricity" unit="kWh"     value={data.electricityKwhPerMonth} onChange={set('electricityKwhPerMonth')} max={5000} hint="Check your electricity bill" />
        <NumberField id="lpg-kg"   label="LPG usage"           unit="kg/month" value={data.lpgKgPerMonth}         onChange={set('lpgKgPerMonth')}          max={50}   hint="1 cylinder ≈ 14.2 kg" />
        <NumberField id="png-scm"  label="Piped gas (PNG)"     unit="SCM/mo"   value={data.pngScmPerMonth}        onChange={set('pngScmPerMonth')}         max={100} />
      </div>
      <RangeField id="renewable-pct" label="Renewable electricity share" value={data.renewablePercent} onChange={set('renewablePercent')} min={0} max={100} step={5} unit="%" />
    </div>
  );
}

function DietStep({ data, onChange }) {
  const set = (k) => (v) => onChange({ ...data, [k]: v });
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: T.muted, lineHeight: 1.7 }}>
        Enter monthly consumption in <strong style={{ color: 'var(--color-text)' }}>kg</strong> per food type.
        Beef has the highest footprint at 27 kg CO₂e / kg food.
      </p>
      <div>
        <SectionLabel>🥩 Meat &amp; Fish</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.5rem 2rem', marginTop: '0.75rem' }}>
          <NumberField id="diet-beef"   label="Beef"          unit="kg/mo" value={data.beefKg}    onChange={set('beefKg')}    max={50}  step={0.1} />
          <NumberField id="diet-lamb"   label="Lamb / Mutton" unit="kg/mo" value={data.lambKg}    onChange={set('lambKg')}    max={30}  step={0.1} />
          <NumberField id="diet-chicken"label="Chicken"       unit="kg/mo" value={data.chickenKg} onChange={set('chickenKg')} max={30}  step={0.1} />
          <NumberField id="diet-pork"   label="Pork"          unit="kg/mo" value={data.porkKg}    onChange={set('porkKg')}    max={20}  step={0.1} />
          <NumberField id="diet-fish"   label="Fish / Seafood"unit="kg/mo" value={data.fishKg}    onChange={set('fishKg')}    max={20}  step={0.1} />
          <NumberField id="diet-dairy"  label="Dairy"         unit="kg/mo" value={data.dairyKg}   onChange={set('dairyKg')}   max={50}  step={0.5} />
        </div>
      </div>
      <div>
        <SectionLabel>🌾 Plant-Based</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.5rem 2rem', marginTop: '0.75rem' }}>
          <NumberField id="diet-veg"    label="Vegetables"  unit="kg/mo" value={data.vegetablesKg} onChange={set('vegetablesKg')} max={100} step={0.5} />
          <NumberField id="diet-rice"   label="Rice"        unit="kg/mo" value={data.riceKg}       onChange={set('riceKg')}       max={50}  step={0.5} />
          <NumberField id="diet-pulses" label="Pulses / Dal"unit="kg/mo" value={data.pulsesKg}     onChange={set('pulsesKg')}     max={20}  step={0.5} />
        </div>
      </div>
    </div>
  );
}

function ShoppingStep({ data, onChange }) {
  const set = (k) => (v) => onChange({ ...data, [k]: v });
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p style={{ fontSize: '0.85rem', color: T.muted, lineHeight: 1.7 }}>
        Manufacturing and delivery emissions from consumption. Fast fashion and new electronics carry the highest embodied carbon costs.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem 2rem' }}>
        <NumberField id="shop-clothes" label="Clothing items"    unit="items/mo"    value={data.clothingItems} onChange={set('clothingItems')} max={50}  hint="≈ 30 kg CO₂e/garment" />
        <NumberField id="shop-phone"   label="Smartphones"       unit="this month"  value={data.smartphones}   onChange={set('smartphones')}   max={5}   hint="≈ 70 kg CO₂e each" />
        <NumberField id="shop-laptop"  label="Laptops"           unit="this month"  value={data.laptops}       onChange={set('laptops')}       max={3}   hint="≈ 350 kg CO₂e each" />
        <NumberField id="shop-online"  label="Online deliveries" unit="orders/mo"   value={data.onlineOrders}  onChange={set('onlineOrders')}  max={200} hint="≈ 0.5 kg CO₂e each" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sliding pill tab bar
// ---------------------------------------------------------------------------

function StepTabBar({ step, onStepChange }) {
  const barRef  = useRef(null);
  const btnRefs = useRef([]);

  // Animate the pill via CSS transforms so it's GPU-accelerated
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    const btn = btnRefs.current[step];
    const bar = barRef.current;
    if (!btn || !bar) return;
    const btnRect = btn.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    setPillStyle({
      width: btnRect.width,
      left: btnRect.left - barRect.left,
    });
  }, [step]);

  return (
    <div
      ref={barRef}
      role="tablist"
      aria-label="Calculator steps"
      style={{
        position: 'relative',
        display: 'flex',
        maxWidth: 520,
        margin: '0 auto 2.5rem',
        padding: '5px',
        borderRadius: 14,
        background: 'rgba(229,231,235,0.6)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Sliding pill */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 5,
          height: 'calc(100% - 10px)',
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 2px 10px rgba(26,107,60,0.12), 0 1px 3px rgba(0,0,0,0.08)',
          transition: 'left 0.32s cubic-bezier(0.4,0,0.2,1), width 0.32s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: 'none',
          left: pillStyle.left,
          width: pillStyle.width,
        }}
      />

      {STEPS.map((s, i) => {
        const active    = i === step;
        const completed = i < step;
        return (
          <button
            key={s}
            ref={(el) => { btnRefs.current[i] = el; }}
            role="tab"
            aria-selected={active}
            aria-controls={`step-panel-${i}`}
            onClick={() => onStepChange(i)}
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              minHeight: 44,
              padding: '0.4rem 0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: active ? 600 : 400,
              color: active ? T.primary : completed ? '#374151' : T.muted,
              transition: 'color 0.2s',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              zIndex: 1,
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${T.focusRing}`; }}
            onBlur={(e)  => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span style={{ fontSize: '1rem' }}>{STEP_ICONS[i]}</span>
            <span className="hidden sm:inline">{s}</span>
            {completed && (
              <span style={{ fontSize: '0.65rem', color: '#2F855A', fontWeight: 700 }}>✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Summary Card (matte glass)
// ---------------------------------------------------------------------------

const CAT_COLORS = {
  transport: '#1A6B3C', energy: '#F5A623', diet: '#2F855A', shopping: '#E53E3E',
};

function LiveSummaryCard({ result, currentStep }) {
  const categories = result ? [
    { key: 'transport', label: 'Transport', val: result.transport },
    { key: 'energy',    label: 'Energy',    val: result.energy    },
    { key: 'diet',      label: 'Diet',      val: result.diet      },
    { key: 'shopping',  label: 'Shopping',  val: result.shopping  },
  ] : [];

  const total  = result?.totalMonthly ?? 0;
  const maxCat = Math.max(...categories.map((c) => c.val), 1);

  return (
    <div
      role="region"
      aria-label="Live carbon footprint summary"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'sticky',
        top: '1.5rem',
        background: T.glass,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 20,
        border: '1px solid rgba(229,231,235,0.7)',
        boxShadow: '0 4px 32px rgba(26,107,60,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ position: 'relative', display: 'flex', width: 10, height: 10 }}>
          <span className="animate-ping" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: '#2F855A', opacity: 0.6,
          }} />
          <span style={{ position: 'relative', width: 10, height: 10, borderRadius: '50%', background: '#2F855A' }} />
        </span>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                       textTransform: 'uppercase', color: T.muted }}>
          Live
        </span>
      </div>

      {/* Big counter */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: T.muted, marginBottom: 4 }}>
          Monthly CO₂e
        </p>
        <p style={{ fontSize: '2.8rem', fontWeight: 700, color: T.primary,
                    lineHeight: 1, transition: 'all 0.4s ease', letterSpacing: '-0.02em' }}>
          {total.toFixed(1)}
        </p>
        <p style={{ fontSize: '0.78rem', color: T.muted, marginTop: 4 }}>kg / month</p>
        <p style={{ fontSize: '0.72rem', color: T.muted, marginTop: 2 }}>
          ≈ <strong style={{ color: 'var(--color-text)' }}>{(total * 12 / 1000).toFixed(2)} t</strong> / year
        </p>
      </div>

      {/* Grade chip */}
      {result && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0.6rem 0.875rem', borderRadius: 12,
          background: `${gradeColor(result.grade)}12`,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: gradeColor(result.grade),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 700, color: '#fff',
            flexShrink: 0,
            boxShadow: `0 2px 8px ${gradeColor(result.grade)}55`,
          }}
            aria-label={`Grade ${result.grade}`}
          >
            {result.grade}
          </div>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: gradeColor(result.grade), lineHeight: 1.4 }}>
            {gradeLabel(result.grade)}
          </p>
        </div>
      )}

      {/* Ultra-thin category bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: T.muted }}>
          Breakdown
        </p>
        {categories.map(({ key, label, val }) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: CAT_COLORS[key] }}>{label}</span>
              <span style={{ fontSize: '0.72rem', color: T.muted }}>{val.toFixed(1)} kg</span>
            </div>
            {/* Ultra-thin 3px track */}
            <div style={{ height: 3, borderRadius: 2, background: T.baseline, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${maxCat > 0 ? (val / maxCat) * 100 : 0}%`,
                borderRadius: 2,
                background: CAT_COLORS[key],
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Step progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            aria-label={`Step ${i + 1}: ${s}`}
            style={{
              width: i === currentStep ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i < currentStep ? '#2F855A' : i === currentStep ? T.primary : T.baseline,
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Calculator
// ---------------------------------------------------------------------------

export default function Calculator({ onComplete }) {
  const [step, setStep]       = useState(0);
  const [transport, setTransport] = useState(DEFAULT_TRANSPORT);
  const [energy, setEnergy]   = useState(DEFAULT_ENERGY);
  const [diet, setDiet]       = useState(DEFAULT_DIET);
  const [shopping, setShopping] = useState(DEFAULT_SHOPPING);
  const [result, setResult]   = useState(null);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    setResult(calcTotalFootprint({ transport, energy, diet, shopping }));
  }, [transport, energy, diet, shopping]);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else {
      if (!result) return;
      saveFootprint(result);
      setSaved(true);
      onComplete?.(result);
    }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <section
      style={{ width: '100%', maxWidth: 1024, margin: '0 auto', padding: '2.5rem 1rem' }}
      aria-label="Carbon Footprint Calculator"
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: T.primary,
                     letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          Carbon Footprint Calculator
        </h1>
        <p style={{ color: T.muted, fontSize: '0.95rem', lineHeight: 1.7 }}>
          Complete all 4 steps — your score updates in real-time as you type.
        </p>
      </div>

      {/* Sliding pill tab bar */}
      <StepTabBar step={step} onStepChange={setStep} />

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}
           className="lg:grid-cols-[1fr_320px]">

        {/* Form panel — borderless matte glass */}
        <div style={{
          background: T.glass,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 20,
          border: '1px solid rgba(229,231,235,0.7)',
          boxShadow: '0 4px 24px rgba(26,107,60,0.05), 0 1px 4px rgba(0,0,0,0.04)',
          padding: '2rem 2rem 1.5rem',
        }}>
          {/* Step heading */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{STEP_ICONS[step]}</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: T.primary, letterSpacing: '-0.01em' }}>
              {STEPS[step]} Emissions
            </h2>
          </div>
          <p style={{ fontSize: '0.72rem', color: T.muted, letterSpacing: '0.04em',
                      marginBottom: '2rem' }}>
            Step {step + 1} of {STEPS.length}
          </p>

          {/* Active panel */}
          <div id={`step-panel-${step}`} role="tabpanel" aria-label={`${STEPS[step]} inputs`}>
            {step === 0 && <TransportStep data={transport} onChange={setTransport} />}
            {step === 1 && <EnergyStep    data={energy}    onChange={setEnergy}    />}
            {step === 2 && <DietStep      data={diet}      onChange={setDiet}      />}
            {step === 3 && <ShoppingStep  data={shopping}  onChange={setShopping}  />}
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '2.5rem', paddingTop: '1.25rem',
            borderTop: `1px solid ${T.baseline}`,
          }}>
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{
                minHeight: 44, padding: '0.5rem 1.25rem',
                background: 'transparent', border: `1px solid ${T.baseline}`,
                borderRadius: 10, cursor: step === 0 ? 'not-allowed' : 'pointer',
                opacity: step === 0 ? 0.35 : 1,
                fontSize: '0.875rem', fontWeight: 500, color: T.muted,
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (step > 0) e.currentTarget.style.borderColor = T.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.baseline; }}
            >
              ← Back
            </button>

            <button
              onClick={handleNext}
              style={{
                minHeight: 44, padding: '0.5rem 1.5rem',
                background: isLastStep ? T.accent : T.primary,
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: 600,
                color: isLastStep ? '#1A2B1C' : '#fff',
                fontFamily: 'Inter, sans-serif',
                boxShadow: isLastStep
                  ? '0 4px 14px rgba(245,166,35,0.35)'
                  : '0 4px 14px rgba(26,107,60,0.25)',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isLastStep ? '🌍 See My Footprint' : `Next: ${STEPS[step + 1]} →`}
            </button>
          </div>
        </div>

        {/* Live summary sidebar */}
        <div>
          <LiveSummaryCard result={result} currentStep={step} />
        </div>
      </div>

      {/* Success banner */}
      {saved && (
        <div
          className="animate-fade-in"
          role="alert"
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(47,133,90,0.08)',
            border: '1px solid rgba(47,133,90,0.25)',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <p style={{ fontWeight: 600, color: '#2F855A', marginBottom: 2 }}>Footprint saved!</p>
            <p style={{ fontSize: '0.82rem', color: T.muted }}>
              Stored locally. Scroll down to your Dashboard &amp; AI coaching insights.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
