
/**
 * Security Utilities for Input Validation and Sanitization
 * Centralizes security logic to prevent XSS, Injection, and other client-side vulnerabilities.
 */

/**
 * Sanitizes a string to prevent XSS by escaping HTML special characters.
 * @param {string} input - The raw input string.
 * @returns {string} - The sanitized string.
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Validates if a string is a valid Hedera Token ID (e.g., 0.0.12345).
 * @param {string} tokenId 
 * @returns {boolean}
 */
export const isValidHederaTokenId = (tokenId) => {
  return /^0\.0\.\d+$/.test(tokenId);
};

/**
 * Validates if a string is a valid numeric Serial Number.
 * @param {string|number} serialNumber 
 * @returns {boolean}
 */
export const isValidSerialNumber = (serialNumber) => {
  return /^\d+$/.test(String(serialNumber));
};

/**
 * Validates if a string is a valid SHA-256 Hash (64 hex characters).
 * @param {string} hash 
 * @returns {boolean}
 */
export const isValidSHA256 = (hash) => {
  return /^[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Validates a LinkedIn URL.
 * @param {string} url 
 * @returns {boolean}
 */
export const isValidLinkedInUrl = (url) => {
  if (!url) return true; // Optional field
  return /^https:\/\/[a-z]{2,3}\.linkedin\.com\/.*$/i.test(url);
};

/**
 * Validates a general alphanumeric ID (with hyphens/underscores).
 * @param {string} id 
 * @returns {boolean}
 */
export const isValidId = (id) => {
  if (!id) return true;
  return /^[a-zA-Z0-9-_]+$/.test(id);
};

/**
 * Safe JSON parser that catches errors and returns null on failure.
 * @param {string} jsonString 
 * @returns {object|null}
 */
export const safeJsonParse = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
};
