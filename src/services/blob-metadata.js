/**
 * Blob Metadata Service
 * Handles fetching and parsing blob metadata from Sui blockchain
 */

import { SuiClient } from '@mysten/sui/client';
import { getSuiRpcUrl } from '../utils/settings.js';
import { PAGE_TITLE_ATTRIBUTE, CONTENT_TYPE_ATTRIBUTE } from '../config/constants.js';

/**
 * Get blob metadata including expiry and storage information
 * @param {string} objectId - Blob object ID on Sui blockchain
 * @returns {Promise<Object>} Blob metadata object
 */
export async function getBlobMetadata(objectId) {
  try {
    const suiRpcUrl = getSuiRpcUrl();
    const client = new SuiClient({ url: suiRpcUrl });
    
    // Get object details
    const object = await client.getObject({
      id: objectId,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      }
    });
    
    if (!object || !object.data) {
      throw new Error('Blob object not found');
    }
    
    // Extract blob metadata from object content
    const content = object.data.content;
    let expiryEpoch = null;
    let blobId = null;
    let storageSize = null;
    
    if (content && content.dataType === 'moveObject' && content.fields) {
      const fields = content.fields;
      
      // Try to extract common Walrus blob fields
      if (fields.storage && fields.storage.fields) {
        expiryEpoch = fields.storage.fields.end_epoch || fields.storage.fields.endEpoch;
        storageSize = fields.storage.fields.storage_size || fields.storage.fields.storageSize;
      }
      
      blobId = fields.blob_id || fields.blobId || fields.id;
    }
    
    return {
      objectId,
      expiryEpoch,
      blobId,
      storageSize,
      owner: object.data.owner,
    };
    
  } catch (error) {
    console.error('Error getting blob metadata:', error);
    // Return partial data instead of throwing
    return {
      objectId,
      expiryEpoch: null,
      blobId: null,
      error: error.message,
    };
  }
}

/**
 * Get a specific attribute from blob metadata
 * @param {string} objectId - Blob object ID
 * @param {string} attributeName - Name of attribute to retrieve
 * @returns {Promise<string|null>} Attribute value or null
 */
export async function getBlobAttribute(objectId, attributeName) {
  try {
    const suiRpcUrl = getSuiRpcUrl();
    const client = new SuiClient({ url: suiRpcUrl });
    
    // Get dynamic fields (where attributes are stored)
    const dynamicFields = await client.getDynamicFields({
      parentId: objectId,
    });
    
    if (!dynamicFields || !dynamicFields.data) {
      return null;
    }
    
    // Look for the "metadata" field
    for (const field of dynamicFields.data) {
      let fieldName = field.name?.value;
      if (Array.isArray(fieldName)) {
        fieldName = String.fromCharCode(...fieldName);
      } else {
        fieldName = field.name?.value || field.name;
      }
      
      if (fieldName === 'metadata') {
        // Get the metadata object
        const metadataObject = await client.getDynamicFieldObject({
          parentId: objectId,
          name: field.name,
        });
        
        // Look for attributes in the metadata
        const metadataFields = metadataObject?.data?.content?.fields?.value?.fields;
        
        if (metadataFields && metadataFields.metadata) {
          const contents = metadataFields.metadata.fields?.contents;
          
          if (Array.isArray(contents)) {
            for (const entry of contents) {
              const key = entry.fields?.key || entry.key;
              const value = entry.fields?.value || entry.value;
              
              if (key === attributeName) {
                return value;
              }
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${attributeName}:`, error);
    return null;
  }
}

/**
 * Get content-type attribute from blob metadata
 * @param {string} objectId - Blob object ID
 * @returns {Promise<string|null>} Content type or null
 */
export async function getContentType(objectId) {
  return getBlobAttribute(objectId, CONTENT_TYPE_ATTRIBUTE);
}

/**
 * Get page title attribute from blob metadata
 * @param {string} objectId - Blob object ID
 * @returns {Promise<string|null>} Page title or null
 */
export async function getPageTitle(objectId) {
  const title = await getBlobAttribute(objectId, PAGE_TITLE_ATTRIBUTE);
  console.log('🔍 Fetched page title for', objectId, ':', title);
  return title;
}
