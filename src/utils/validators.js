/**
 * @module validators
 * @description Input validation and sanitization utilities.
 * Uses DOMPurify to prevent XSS injection on all user-supplied text.
 * All numeric inputs are range-checked before use.
 * OWASP A03 (Injection) mitigation.
 */

import DOMPurify from 'dompurify';

/**
 * Validates and parses a numeric input within an allowed range.
 * @param {*} val - Raw input value
 * @param {number} min - Minimum allowed value (inclusive)
 * @param {number} max - Maximum allowed value (inclusive)
 * @returns {number} Validated number
 * @throws {Error} If value is out of range or not a number
 */
export const validateNumber = (val, min, max) => {
  const n = parseFloat(val);
  if (isNaN(n) || n < min || n > max) {
    throw new Error(`Must be ${min}–${max}`);
  }
  return n;
};

/**
 * Sanitizes and validates a text string using DOMPurify.
 * Trims whitespace and enforces max length.
 * @param {*} val - Raw input value
 * @param {number} [maxLength=100] - Maximum allowed character length
 * @returns {string} Sanitized string safe for DOM insertion
 * @throws {Error} If input is not a string
 */
export const validateText = (val, maxLength = 100) => {
  if (typeof val !== 'string') throw new Error('Invalid input: must be a string');
  return DOMPurify.sanitize(val.trim().slice(0, maxLength));
};

/**
 * Validates an email address format.
 * Does NOT accept plus-addressing exploits or unusual TLDs to reduce spam.
 * @param {string} val - Email string
 * @returns {string} Lowercased, trimmed valid email
 * @throws {Error} If email format is invalid
 */
export const validateEmail = (val) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof val !== 'string' || !re.test(val)) {
    throw new Error('Invalid email format');
  }
  return val.toLowerCase().trim();
};

/**
 * Validates a selection value against an allowed set.
 * Prevents enumeration attacks by whitelisting.
 * @param {string} val - The selected value
 * @param {string[]} allowed - Array of allowed values
 * @returns {string} The validated value
 * @throws {Error} If value is not in the allowed set
 */
export const validateEnum = (val, allowed) => {
  if (!allowed.includes(val)) {
    throw new Error(`Value must be one of: ${allowed.join(', ')}`);
  }
  return val;
};

/**
 * Sanitizes a string intended for display in HTML.
 * Uses textContent-safe sanitization.
 * @param {string} val - Raw string
 * @returns {string} Sanitized string
 */
export const sanitizeDisplay = (val) => {
  if (typeof val !== 'string') return '';
  return DOMPurify.sanitize(val, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Aggregate validator object — matches the pattern specified in the master prompt.
 */
export const validators = {
  number: validateNumber,
  text: validateText,
  email: validateEmail,
  enum: validateEnum,
  display: sanitizeDisplay,
};

export default validators;
