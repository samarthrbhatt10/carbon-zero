/**
 * @module constants
 * @description App-wide constants for CarbonZero platform.
 * Single source of truth for all magic strings and config values.
 */

// ---------------------------------------------------------------------------
// App metadata
// ---------------------------------------------------------------------------

export const APP_NAME = 'CarbonZero';
export const APP_TAGLINE = 'Know your footprint. Shrink it. Own it.';
export const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// LocalStorage key namespace
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = Object.freeze({
  USER_FOOTPRINT: 'cz_footprint_v1',
  USER_ACTIONS: 'cz_actions_v1',
  USER_PROFILE: 'cz_profile_v1',
  LEADERBOARD: 'cz_leaderboard_v1',
  COACH_CACHE_PREFIX: 'cz_coach_',
  DAILY_LOG: 'cz_daily_log_v1',
  STREAK: 'cz_streak_v1',
  BADGES: 'cz_badges_v1',
  POINTS: 'cz_points_v1',
  SCHEMA_VERSION: 'cz_schema_version',
  USER_SESSION: 'cz_session_v1',
  THEME_PREF: 'cz_theme_v1',
  ONBOARDING_DONE: 'cz_onboarding_v1',
});

export const CURRENT_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Benchmark comparisons
// ---------------------------------------------------------------------------

export const BENCHMARKS = Object.freeze({
  INDIA_ANNUAL_TONNES: 1.9,
  GLOBAL_ANNUAL_TONNES: 4.7,
  PARIS_TARGET_TONNES: 2.3,
});

// ---------------------------------------------------------------------------
// Navigation tabs
// ---------------------------------------------------------------------------

export const NAV_TABS = Object.freeze([
  { id: 'home', label: 'Home', icon: 'Home' },
  { id: 'calculate', label: 'Calculate', icon: 'Calculator' },
  { id: 'dashboard', label: 'Track', icon: 'BarChart2' },
  { id: 'actions', label: 'Actions', icon: 'Leaf' },
  { id: 'community', label: 'Community', icon: 'Users' },
]);

// ---------------------------------------------------------------------------
// Points system
// ---------------------------------------------------------------------------

export const POINTS = Object.freeze({
  LOG_ACTION: 10,
  COMPLETE_CHALLENGE: 50,
  DAILY_CHECKIN: 5,
  STREAK_BONUS_7: 25,
  STREAK_BONUS_30: 100,
  SHARE_CARD: 20,
});

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

export const BADGES = Object.freeze([
  { id: 'first_step', name: 'First Step', description: 'Complete your first carbon calculation', icon: '🌱', threshold: 1 },
  { id: 'green_commuter', name: 'Green Commuter', description: 'Log 7 days of public transport use', icon: '🚌', threshold: 7 },
  { id: 'plant_pioneer', name: 'Plant-Based Pioneer', description: 'Log 14 meat-free days', icon: '🥗', threshold: 14 },
  { id: 'solar_champ', name: 'Solar Champion', description: 'Report >50% renewable electricity', icon: '☀️', threshold: 50 },
  { id: 'week_warrior', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', threshold: 7 },
  { id: 'month_master', name: 'Month Master', description: 'Maintain a 30-day streak', icon: '🏆', threshold: 30 },
  { id: 'eco_sharer', name: 'Eco Sharer', description: 'Share your carbon report card', icon: '📢', threshold: 1 },
  { id: 'action_hero', name: 'Action Hero', description: 'Complete 10 carbon-reduction actions', icon: '💪', threshold: 10 },
  { id: 'carbon_cutter', name: 'Carbon Cutter', description: 'Reduce footprint by 20% vs your first score', icon: '✂️', threshold: 20 },
  { id: 'paris_pal', name: 'Paris Pal', description: 'Achieve a footprint below the Paris Agreement target', icon: '🌍', threshold: 2.3 },
]);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const CATEGORIES = Object.freeze({
  TRANSPORT: 'transport',
  ENERGY: 'energy',
  DIET: 'diet',
  SHOPPING: 'shopping',
  ADVOCACY: 'advocacy',
});

export const CATEGORY_LABELS = Object.freeze({
  transport: 'Transport',
  energy: 'Energy',
  diet: 'Diet',
  shopping: 'Shopping',
  advocacy: 'Advocacy',
});

export const DIFFICULTY_LEVELS = Object.freeze(['Easy', 'Medium', 'Hard']);

// ---------------------------------------------------------------------------
// Chart.js color palette (accessible, design-system aligned)
// ---------------------------------------------------------------------------

export const CHART_COLORS = Object.freeze({
  transport: '#1A6B3C',
  energy: '#F5A623',
  diet: '#2F855A',
  shopping: '#E53E3E',
  target: '#718096',
});
