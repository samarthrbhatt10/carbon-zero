/**
 * @module formatters
 * @description Number formatting, date utilities, and display helpers.
 * All functions are pure and side-effect free.
 */

// ---------------------------------------------------------------------------
// Number formatters
// ---------------------------------------------------------------------------

/**
 * Formats a CO₂e value in kg to a human-readable string.
 * Automatically converts to tonnes if >= 1000 kg.
 * @param {number} kgCO2e - kg CO₂e value
 * @param {number} [decimals=1] - Decimal places
 * @returns {string} e.g. "245.3 kg CO₂e" or "1.2 tonnes CO₂e"
 */
export const formatCO2e = (kgCO2e, decimals = 1) => {
  if (typeof kgCO2e !== 'number' || isNaN(kgCO2e)) return '—';
  if (kgCO2e >= 1000) {
    return `${(kgCO2e / 1000).toFixed(decimals)} tonnes CO₂e`;
  }
  return `${kgCO2e.toFixed(decimals)} kg CO₂e`;
};

/**
 * Formats a number as Indian Rupees.
 * @param {number} amount
 * @returns {string} e.g. "₹1,234"
 */
export const formatINR = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹—';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

/**
 * Formats a percentage with a % suffix.
 * @param {number} value - 0–100
 * @param {number} [decimals=0]
 * @returns {string}
 */
export const formatPercent = (value, decimals = 0) => {
  if (typeof value !== 'number' || isNaN(value)) return '—%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Rounds a number to a given number of decimal places.
 * @param {number} n
 * @param {number} [dp=2]
 * @returns {number}
 */
export const round = (n, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

// ---------------------------------------------------------------------------
// Date utilities
// ---------------------------------------------------------------------------

/**
 * Returns a date string in YYYY-MM-DD format (local time).
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export const toDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns a human-readable date string.
 * @param {string|Date} date
 * @returns {string} e.g. "Jun 19, 2026"
 */
export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Returns the name of the current month.
 * @param {Date} [date=new Date()]
 * @returns {string} e.g. "June"
 */
export const monthName = (date = new Date()) => {
  return date.toLocaleDateString('en-IN', { month: 'long' });
};

/**
 * Returns the Monday of the current ISO week.
 * @param {Date} [date=new Date()]
 * @returns {Date}
 */
export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// ---------------------------------------------------------------------------
// Grade display helpers
// ---------------------------------------------------------------------------

/**
 * Returns a color class string for a given grade letter.
 * @param {string} grade - A|B|C|D|E|F
 * @returns {string} CSS color hex
 */
export const gradeColor = (grade) => {
  const map = {
    A: '#2F855A',
    B: '#38A169',
    C: '#D69E2E',
    D: '#DD6B20',
    E: '#E53E3E',
    F: '#9B2C2C',
  };
  return map[grade] || '#718096';
};

/**
 * Returns a descriptive label for a grade.
 * @param {string} grade
 * @returns {string}
 */
export const gradeLabel = (grade) => {
  const map = {
    A: 'Excellent — Below Paris Target!',
    B: 'Great — Near Paris Target',
    C: 'Average — Room to Improve',
    D: 'Above Average — Focus Needed',
    E: 'High — Significant Reduction Needed',
    F: 'Very High — Urgent Action Required',
  };
  return map[grade] || 'Unknown';
};

// ---------------------------------------------------------------------------
// Ordinal helper
// ---------------------------------------------------------------------------

/**
 * Converts a number to its ordinal string.
 * @param {number} n
 * @returns {string} e.g. "1st", "22nd", "103rd"
 */
export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
