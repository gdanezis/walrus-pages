/**
 * API utilities for fetching blob data
 */

import { getUserBlobs, getAllUserBlobs } from './upload.js';
import { getWalletAddress } from './wallet.js';

/**
 * Fetch all blobs for the connected user
 * @param {Object} options - Options for filtering
 * @param {boolean} options.includeExpired - Include expired blobs (default: false)
 * @returns {Promise<Array>} Array of blob objects with metadata
 */
export async function fetchBlobs(options = {}) {
  const address = getWalletAddress();
  if (!address) {
    throw new Error('Wallet not connected');
  }
  return await getUserBlobs(address, options);
}

/**
 * Fetch ALL blobs for admin purposes (no content-type filtering)
 * @returns {Promise<Array>} Array of all blob objects with metadata
 */
export async function fetchAllBlobs() {
  const address = getWalletAddress();
  if (!address) {
    throw new Error('Wallet not connected');
  }
  return await getAllUserBlobs(address);
}
