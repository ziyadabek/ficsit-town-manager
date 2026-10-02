/**
 * Calculates actual power consumption based on Satisfactory 1.0 formula
 * @param {number} nominalPower Base power consumption in MW
 * @param {number} clockSpeed Clock speed percentage (e.g. 100, 150)
 * @returns {number} Actual power in MW
 */
export function calculatePower(nominalPower, clockSpeed, somersloopsActive = false) {
  const exponent = 1.321928;
  return nominalPower * Math.pow(clockSpeed / 100, exponent) * (somersloopsActive ? 4.0 : 1.0);
}

/**
 * Calculates actual power generation based on Satisfactory 1.0 formula
 * @param {number} nominalGeneration Base power generation in MW
 * @param {number} clockSpeed Clock speed percentage (e.g. 100, 150)
 * @returns {number} Actual generation in MW
 */
export function calculateGeneration(nominalGeneration, clockSpeed) {
  return nominalGeneration * (clockSpeed / 100);
}
