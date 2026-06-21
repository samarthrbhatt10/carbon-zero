/**
 * @module carbonCalc
 * @description Carbon footprint calculation engine using IPCC AR6 / UK DEFRA emission factors.
 * All coefficients are sourced from:
 *   - IPCC AR6 Working Group III (2022)
 *   - UK DEFRA GHG Conversion Factors 2023
 *   - India CEA CO2 Baseline Database 2023 (for India grid electricity)
 *
 * Units: kg CO₂e (CO₂ equivalent) per activity unit.
 * All functions are pure — no side effects, fully testable with Vitest.
 */

// ---------------------------------------------------------------------------
// SECTION 2.3 — IPCC Emission Factors (exact values from master prompt spec)
// ---------------------------------------------------------------------------

export const EMISSION_FACTORS = Object.freeze({
  transport: {
    car_petrol_per_km: 0.192,         // kg CO₂e per km
    car_diesel_per_km: 0.171,
    car_electric_per_km: 0.053,
    flight_domestic_per_km: 0.255,
    flight_international_per_km: 0.195,
    bus_per_km: 0.089,
    train_per_km: 0.041,
    motorcycle_per_km: 0.114,
    autorickshaw_per_km: 0.096,
  },
  energy: {
    india_grid_electricity_per_kwh: 0.708,  // India CEA 2023 — kg CO₂e/kWh
    lpg_per_kg: 2.983,
    png_per_scm: 2.204,
    solar_per_kwh: 0.041,
  },
  diet: {
    beef_per_kg: 27.0,
    lamb_per_kg: 39.2,
    chicken_per_kg: 6.9,
    pork_per_kg: 12.1,
    fish_per_kg: 6.1,
    dairy_per_kg: 3.2,
    vegetables_per_kg: 2.0,
    rice_per_kg: 2.7,
    pulses_per_kg: 0.9,
  },
  shopping: {
    clothing_per_item: 30.0,
    electronics_smartphone: 70.0,
    electronics_laptop: 350.0,
    online_order_delivery: 0.5,
  },
});

// ---------------------------------------------------------------------------
// Benchmark Targets (for comparison bars)
// ---------------------------------------------------------------------------

export const BENCHMARKS = Object.freeze({
  india_average_annual_tCO2e: 1.9,       // tonnes CO₂e/year
  global_average_annual_tCO2e: 4.7,
  paris_target_annual_tCO2e: 2.3,
});

// ---------------------------------------------------------------------------
// Transport Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates monthly transport CO₂e emissions.
 * @param {Object} transport - Transport data
 * @param {number} transport.carKmPerMonth - km driven by car per month
 * @param {string} transport.carType - 'petrol' | 'diesel' | 'electric'
 * @param {number} transport.flightKmPerMonth - km flown per month (domestic)
 * @param {number} transport.intFlightKmPerMonth - km flown per month (international)
 * @param {number} transport.busKmPerMonth - km by bus per month
 * @param {number} transport.trainKmPerMonth - km by train per month
 * @param {number} transport.motorcycleKmPerMonth - km by motorcycle per month
 * @param {number} transport.autoKmPerMonth - km by autorickshaw per month
 * @returns {number} kg CO₂e per month
 */
export const calcTransportEmissions = (transport) => {
  const f = EMISSION_FACTORS.transport;
  const {
    carKmPerMonth = 0,
    carType = 'petrol',
    flightKmPerMonth = 0,
    intFlightKmPerMonth = 0,
    busKmPerMonth = 0,
    trainKmPerMonth = 0,
    motorcycleKmPerMonth = 0,
    autoKmPerMonth = 0,
  } = transport;

  const carFactor = carType === 'diesel'
    ? f.car_diesel_per_km
    : carType === 'electric'
    ? f.car_electric_per_km
    : f.car_petrol_per_km;

  return (
    carKmPerMonth * carFactor +
    flightKmPerMonth * f.flight_domestic_per_km +
    intFlightKmPerMonth * f.flight_international_per_km +
    busKmPerMonth * f.bus_per_km +
    trainKmPerMonth * f.train_per_km +
    motorcycleKmPerMonth * f.motorcycle_per_km +
    autoKmPerMonth * f.autorickshaw_per_km
  );
};

// ---------------------------------------------------------------------------
// Energy Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates monthly home energy CO₂e emissions.
 * Automatically splits electricity between grid and solar based on renewablePercent.
 * @param {Object} energy - Energy consumption data
 * @param {number} energy.electricityKwhPerMonth - Total electricity kWh per month
 * @param {number} energy.renewablePercent - % of electricity from renewables (0–100)
 * @param {number} energy.lpgKgPerMonth - LPG consumed in kg per month
 * @param {number} energy.pngScmPerMonth - PNG (piped natural gas) in SCM per month
 * @returns {number} kg CO₂e per month
 */
export const calcEnergyEmissions = (energy) => {
  const f = EMISSION_FACTORS.energy;
  const {
    electricityKwhPerMonth = 0,
    renewablePercent = 0,
    lpgKgPerMonth = 0,
    pngScmPerMonth = 0,
  } = energy;

  const renewableFraction = Math.min(Math.max(renewablePercent, 0), 100) / 100;
  const gridKwh = electricityKwhPerMonth * (1 - renewableFraction);
  const solarKwh = electricityKwhPerMonth * renewableFraction;

  return (
    gridKwh * f.india_grid_electricity_per_kwh +
    solarKwh * f.solar_per_kwh +
    lpgKgPerMonth * f.lpg_per_kg +
    pngScmPerMonth * f.png_per_scm
  );
};

// ---------------------------------------------------------------------------
// Diet Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates monthly diet CO₂e emissions.
 * @param {Object} diet - Monthly food consumption in kg
 * @param {number} diet.beefKg
 * @param {number} diet.lambKg
 * @param {number} diet.chickenKg
 * @param {number} diet.porkKg
 * @param {number} diet.fishKg
 * @param {number} diet.dairyKg
 * @param {number} diet.vegetablesKg
 * @param {number} diet.riceKg
 * @param {number} diet.pulsesKg
 * @returns {number} kg CO₂e per month
 */
export const calcDietEmissions = (diet) => {
  const f = EMISSION_FACTORS.diet;
  const {
    beefKg = 0,
    lambKg = 0,
    chickenKg = 0,
    porkKg = 0,
    fishKg = 0,
    dairyKg = 0,
    vegetablesKg = 0,
    riceKg = 0,
    pulsesKg = 0,
  } = diet;

  return (
    beefKg * f.beef_per_kg +
    lambKg * f.lamb_per_kg +
    chickenKg * f.chicken_per_kg +
    porkKg * f.pork_per_kg +
    fishKg * f.fish_per_kg +
    dairyKg * f.dairy_per_kg +
    vegetablesKg * f.vegetables_per_kg +
    riceKg * f.rice_per_kg +
    pulsesKg * f.pulses_per_kg
  );
};

// ---------------------------------------------------------------------------
// Shopping Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates monthly shopping CO₂e emissions.
 * @param {Object} shopping - Monthly purchase quantities
 * @param {number} shopping.clothingItems - Number of clothing items bought
 * @param {number} shopping.smartphones - Number of smartphones bought
 * @param {number} shopping.laptops - Number of laptops bought
 * @param {number} shopping.onlineOrders - Number of online delivery orders
 * @returns {number} kg CO₂e per month
 */
export const calcShoppingEmissions = (shopping) => {
  const f = EMISSION_FACTORS.shopping;
  const {
    clothingItems = 0,
    smartphones = 0,
    laptops = 0,
    onlineOrders = 0,
  } = shopping;

  return (
    clothingItems * f.clothing_per_item +
    smartphones * f.electronics_smartphone +
    laptops * f.electronics_laptop +
    onlineOrders * f.online_order_delivery
  );
};

// ---------------------------------------------------------------------------
// Total Footprint Aggregator
// ---------------------------------------------------------------------------

/**
 * Calculates the total monthly carbon footprint across all categories.
 * Returns both the total and the per-category breakdown.
 * @param {Object} data - All user data
 * @param {Object} data.transport - Transport data (see calcTransportEmissions)
 * @param {Object} data.energy - Energy data (see calcEnergyEmissions)
 * @param {Object} data.diet - Diet data (see calcDietEmissions)
 * @param {Object} data.shopping - Shopping data (see calcShoppingEmissions)
 * @returns {{
 *   transport: number,
 *   energy: number,
 *   diet: number,
 *   shopping: number,
 *   totalMonthly: number,
 *   totalAnnual: number,
 *   grade: string,
 *   percentileVsIndia: number,
 *   percentileVsGlobal: number
 * }}
 */
export const calcTotalFootprint = (data) => {
  const transport = calcTransportEmissions(data.transport || {});
  const energy = calcEnergyEmissions(data.energy || {});
  const diet = calcDietEmissions(data.diet || {});
  const shopping = calcShoppingEmissions(data.shopping || {});

  const totalMonthly = transport + energy + diet + shopping;
  const totalAnnual = totalMonthly * 12;
  const totalAnnualTonnes = totalAnnual / 1000;

  return {
    transport: Math.round(transport * 100) / 100,
    energy: Math.round(energy * 100) / 100,
    diet: Math.round(diet * 100) / 100,
    shopping: Math.round(shopping * 100) / 100,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalAnnual: Math.round(totalAnnual * 100) / 100,
    grade: calcGrade(totalAnnualTonnes),
    vsIndiaAvg: BENCHMARKS.india_average_annual_tCO2e,
    vsGlobalAvg: BENCHMARKS.global_average_annual_tCO2e,
    vsParisTarget: BENCHMARKS.paris_target_annual_tCO2e,
    totalAnnualTonnes: Math.round(totalAnnualTonnes * 100) / 100,
  };
};

// ---------------------------------------------------------------------------
// Grade Calculator
// ---------------------------------------------------------------------------

/**
 * Returns a letter grade based on annual CO₂e in tonnes.
 * Grade thresholds aligned to Paris Agreement targets.
 * @param {number} annualTonnes - Annual CO₂e in tonnes
 * @returns {string} Grade letter: A–F
 */
export const calcGrade = (annualTonnes) => {
  if (annualTonnes < 1.5) return 'A';
  if (annualTonnes < 2.3) return 'B';
  if (annualTonnes < 3.5) return 'C';
  if (annualTonnes < 5.0) return 'D';
  if (annualTonnes < 7.0) return 'E';
  return 'F';
};

// ---------------------------------------------------------------------------
// Action Credit Calculator
// ---------------------------------------------------------------------------

/**
 * Returns the monthly CO₂e credit for a logged daily action.
 * @param {string} actionId - ID of the action from actions.json
 * @param {number} daysPerMonth - Number of days this action was performed
 * @param {number} baseCredit - The daily CO₂e saving in kg
 * @returns {number} kg CO₂e saved per month
 */
export const calcActionCredit = (daysPerMonth, baseCredit) => {
  const days = Math.min(Math.max(daysPerMonth, 0), 31);
  return Math.round(days * baseCredit * 100) / 100;
};

export default {
  EMISSION_FACTORS,
  BENCHMARKS,
  calcTransportEmissions,
  calcEnergyEmissions,
  calcDietEmissions,
  calcShoppingEmissions,
  calcTotalFootprint,
  calcGrade,
  calcActionCredit,
};
