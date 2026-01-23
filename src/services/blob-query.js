/**
 * Blob Query Service
 * Handles querying user blobs from the Sui blockchain
 */

import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { getSuiRpcUrl } from '../utils/settings.js';
import { WALRUS_BLOB_TYPE, WALRUS_NETWORK } from '../config/constants.js';
import { getBlobMetadata, getPageTitle, getContentType, getBlobAttribute } from './blob-metadata.js';

/**
 * Get current Walrus epoch from system state
 * @returns {Promise<number>} Current epoch number
 */
export async function getCurrentEpoch() {
  try {
    const suiRpcUrl = getSuiRpcUrl();
    const walrusClient = new WalrusClient({
      network: WALRUS_NETWORK,
      suiRpcUrl: suiRpcUrl,
    });
    
    const systemState = await walrusClient.systemState();
    const currentEpoch = systemState?.committee?.epoch || 0;
    console.log('Current Walrus epoch:', currentEpoch);
    return currentEpoch;
  } catch (error) {
    console.warn('Could not fetch current epoch:', error);
    return 0;
  }
}

/**
 * Get the sender address and transaction digest from a blob's previous transaction
 * @param {string} objectId - The blob object ID
 * @returns {Promise<{sender: string|null, txDigest: string|null}>} Sender address and transaction digest
 */
export async function getBlobSender(objectId) {
  try {
    const suiRpcUrl = getSuiRpcUrl();
    const client = new SuiClient({ url: suiRpcUrl });
    
    // Get the object to find its previous transaction
    const object = await client.getObject({
      id: objectId,
      options: {
        showPreviousTransaction: true,
      }
    });
    
    const previousTxDigest = object.data?.previousTransaction;
    if (!previousTxDigest) {
      return { sender: null, txDigest: null };
    }
    
    // Get the transaction details to find the sender
    const transaction = await client.getTransactionBlock({
      digest: previousTxDigest,
      options: {
        showInput: true,
      }
    });
    
    const sender = transaction.transaction?.data?.sender || null;
    return { sender, txDigest: previousTxDigest };
  } catch (error) {
    console.error('Error getting blob sender:', error);
    return { sender: null, txDigest: null };
  }
}

/**
 * Get user's blob objects (filtered for markdown pages)
 * @param {string} address - User's wallet address
 * @param {Object} options - Options for filtering
 * @param {boolean} options.includeExpired - Include expired blobs (default: false)
 * @returns {Promise<Array>} Array of blob objects with metadata
 */
export async function getUserBlobs(address, options = {}) {
  const { includeExpired = false } = options;
  
  try {
    const suiRpcUrl = getSuiRpcUrl();
    const client = new SuiClient({ url: suiRpcUrl });
    const currentEpoch = await getCurrentEpoch();
    
    // Query all objects owned by user with pagination
    let allObjects = [];
    let cursor = null;
    let hasNextPage = true;
    
    while (hasNextPage) {
      const result = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: WALRUS_BLOB_TYPE,
        },
        options: {
          showContent: true,
          showType: true,
        },
        limit: 50,
        cursor: cursor,
      });
      
      if (result.data) {
        allObjects = allObjects.concat(result.data);
      }
      
      hasNextPage = result.hasNextPage;
      cursor = result.nextCursor;
    }
    
    if (allObjects.length === 0) {
      return [];
    }
    
    const blobs = [];
    
    // Filter and process Walrus blob objects
    for (const item of allObjects) {
      const object = item.data;
      if (!object) continue;
      
      // Check if this is a Walrus blob type
      const type = object.type || '';
      if (!type.includes('blob::Blob') && !type.toLowerCase().includes('walrus')) {
        continue;
      }
      
      // Get full object details including attributes
      const fullObject = await client.getObject({
        id: object.objectId,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        }
      });
      
      // Check dynamic fields for content-type attribute
      let isMarkdown = false;
      let contentType = null;
      
      try {
        // Get dynamic fields (where attributes are stored in a "metadata" field)
        const dynamicFields = await client.getDynamicFields({
          parentId: object.objectId,
        });
        
        // Look for the "metadata" field
        if (dynamicFields && dynamicFields.data) {
          for (const field of dynamicFields.data) {
            
            // Decode the field name from bytes
            let fieldName = field.name?.value;
            if (Array.isArray(fieldName)) {
              fieldName = String.fromCharCode(...fieldName);
            } else {
              fieldName = field.name?.value || field.name;
            }
            
            if (fieldName === 'metadata') {
              // Get the metadata object
              const metadataObject = await client.getDynamicFieldObject({
                parentId: object.objectId,
                name: field.name,
              });
              
              // Look for attributes in the metadata
              const metadataFields = metadataObject?.data?.content?.fields?.value?.fields;
              
              // Check if there's a metadata map
              if (metadataFields && metadataFields.metadata) {
                const contents = metadataFields.metadata.fields?.contents;
                
                if (Array.isArray(contents)) {
                  for (const entry of contents) {
                    const key = entry.fields?.key || entry.key;
                    const value = entry.fields?.value || entry.value;
                    
                    // Check for content-type
                    if (key === 'content-type' || key === 'content_type') {
                      contentType = value;
                      if (value && (value.includes('markdown') || value.includes('text/markdown'))) {
                        isMarkdown = true;
                      }
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      } catch (dynamicFieldError) {
        console.log('Error fetching dynamic fields:', dynamicFieldError);
      }
      
      // Extract metadata
      const metadata = await getBlobMetadata(object.objectId);
      
      // Get page title
      const pageTitle = await getPageTitle(object.objectId);
      
      // Skip expired blobs (unless includeExpired is true)
      if (!includeExpired && metadata.expiryEpoch && metadata.expiryEpoch <= currentEpoch) {
        continue;
      }
      
      // Skip blobs without content-type
      if (!contentType) {
        continue;
      }
      
      // Skip blobs that are not markdown
      if (!contentType.toLowerCase().includes('markdown')) {
        continue;
      }
      
      // Get sender from previous transaction
      const { sender, txDigest } = await getBlobSender(object.objectId);
      
      const blobData = {
        objectId: object.objectId,
        version: object.version,
        digest: object.digest,
        title: pageTitle || 'Untitled',
        expiryEpoch: metadata.expiryEpoch,
        blobId: metadata.blobId,
        contentType: contentType,
        sender: sender, // Add sender information
        txDigest: txDigest, // Add transaction digest
      };
      
      blobs.push(blobData);
    }
    
    return blobs;
    
  } catch (error) {
    console.error('Error getting user blobs:', error);
    return [];
  }
}

/**
 * Get ALL user's blob objects without filtering by content-type or markdown
 * Used for admin purposes to manage all blobs including expired ones
 * @param {string} address - User's wallet address
 * @returns {Promise<Array>} Array of all blob objects with metadata
 */
export async function getAllUserBlobs(address) {
  try {
    const suiRpcUrl = getSuiRpcUrl();
    const client = new SuiClient({ url: suiRpcUrl });
    const currentEpoch = await getCurrentEpoch();
    
    console.log('🔍 Querying ALL blobs for address:', address);
    console.log('   Filtering by type:', WALRUS_BLOB_TYPE);
    
    // Query for all blob objects owned by this address
    let allObjects = [];
    let hasNextPage = true;
    let cursor = null;
    
    while (hasNextPage) {
      const response = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: WALRUS_BLOB_TYPE,
        },
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
        cursor,
      });
      
      allObjects = allObjects.concat(response.data);
      hasNextPage = response.hasNextPage;
      cursor = response.nextCursor;
    }
    
    console.log('Found objects:', allObjects.length);
    
    const blobs = [];
    
    for (const item of allObjects) {
      if (item.data?.content?.dataType !== 'moveObject') {
        console.log('⚠️ SKIPPING: Not a move object');
        continue;
      }
      
      const object = item.data;
      const fields = object.content.fields;
      
      // Extract metadata
      const metadata = {
        objectId: object.objectId,
        version: object.version,
        digest: object.digest,
        blobId: fields.blob_id,
        size: parseInt(fields.size),
        storageSize: fields.storage?.fields?.storage_size,
        registeredEpoch: parseInt(fields.registered_epoch),
        certifiedEpoch: fields.certified_epoch ? parseInt(fields.certified_epoch) : null,
        expiryEpoch: fields.storage?.fields?.end_epoch ? 
          parseInt(fields.storage.fields.end_epoch) : null,
        isDeletable: fields.deletable,
      };
      
      // For admin page, use simple name
      let name = `Blob ${metadata.blobId.slice(0, 10)}...`;
      
      const blobData = {
        objectId: object.objectId,
        version: object.version,
        digest: object.digest,
        name: name,
        size: metadata.size,
        expiryEpoch: metadata.expiryEpoch,
        certifiedEpoch: metadata.certifiedEpoch,
        blobId: metadata.blobId,
        contentType: 'unknown',
        isExpired: metadata.expiryEpoch && metadata.expiryEpoch < currentEpoch,
        isUncertified: !metadata.certifiedEpoch,
      };
      
      console.log('Blob:', blobData.objectId, 'expired:', blobData.isExpired, 'epoch:', blobData.expiryEpoch, 'certified:', blobData.certifiedEpoch);
      
      blobs.push(blobData);
    }
    
    console.log('Returning all blobs:', blobs.length);
    return blobs;
    
  } catch (error) {
    console.error('Error getting all user blobs:', error);
    return [];
  }
}
