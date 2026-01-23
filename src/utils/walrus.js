/**
 * Walrus Client Module - Handles blob fetching from aggregator
 */

import { detectAggregator } from './router.js';

export async function fetchBlob(idOrObjectId) {
  const aggregator = detectAggregator();
  
  // Determine if this is an object ID (starts with 0x) or blob ID (base64)
  const isObjectId = idOrObjectId.startsWith('0x');
  
  let url;
  if (isObjectId) {
    // For object IDs, use the by-object-id endpoint
    url = `${aggregator}/v1/blobs/by-object-id/${idOrObjectId}`;
  } else {
    // For blob IDs, use the direct endpoint
    url = `${aggregator}/v1/${idOrObjectId}`;
  }
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Error fetching blob:', error);
    throw error;
  }
}

export async function getBlobMetadata(objectId) {
  // TODO: Query Sui RPC for blob object metadata
  // For now, return placeholder
  return {
    expiryEpoch: null
  };
}
