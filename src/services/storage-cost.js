/**
 * Storage Cost Calculation Service
 * Handles cost estimation for Walrus storage operations
 */

import { CoreClient } from '@mysten/sui/client';
import { SUI_RPC_URL, MAX_EPOCHS } from '../config/constants.js';
import { getSuiRpcUrl } from '../utils/settings.js';

/**
 * Calculate storage cost for a blob
 * @param {number} sizeBytes - Size of the content in bytes
 * @param {number} epochs - Number of epochs to store (defaults to MAX_EPOCHS)
 * @returns {Promise<{costWAL: number, costSUI: number, epochs: number}>} Cost estimate
 */
export async function calculateStorageCost(sizeBytes, epochs = MAX_EPOCHS) {
  try {
    const suiRpcUrl = getSuiRpcUrl();
    const client = new CoreClient({ url: suiRpcUrl });
    
    // TODO: Query Walrus system object for current pricing
    // Storage cost = size * epochs * price_per_unit
    
    // Placeholder: approximately 0.036 WAL per 1KB per 50 epochs
    const costPerKB = 0.036;
    const sizeKB = sizeBytes / 1024;
    const estimatedCost = sizeKB * costPerKB * (epochs / 50);
    
    return {
      costWAL: estimatedCost,
      costSUI: estimatedCost * 1000000, // Rough conversion, need actual rate
      epochs,
    };
    
  } catch (error) {
    console.error('Error calculating cost:', error);
    return {
      costWAL: 0,
      costSUI: 0,
      epochs,
    };
  }
}

/**
 * Get cost per KB for storage (placeholder)
 * @returns {number} Cost in WAL per KB per 50 epochs
 */
export function getCostPerKB() {
  return 0.036;
}

/**
 * Convert storage cost from WAL to SUI (rough estimate)
 * @param {number} costWAL - Cost in WAL
 * @returns {number} Cost in SUI
 */
export function convertWALToSUI(costWAL) {
  return costWAL * 1000000; // Placeholder conversion rate
}
