/**
 * Upload Module - Backward Compatibility Shim
 * This module re-exports functions from the new modular structure
 * to maintain compatibility with existing code.
 * 
 * @deprecated Import directly from services modules instead
 */

// Re-export from new service modules
export { uploadToWalrus, extendBlobStorage } from '../services/walrus-upload.js';
export { getBlobMetadata, getContentType, getPageTitle } from '../services/blob-metadata.js';
export { getUserBlobs, getAllUserBlobs, getCurrentEpoch } from '../services/blob-query.js';
export { calculateStorageCost } from '../services/storage-cost.js';
