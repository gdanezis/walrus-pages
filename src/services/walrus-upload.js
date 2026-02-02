/**
 * Walrus Upload Service
 * Handles blob upload operations to Walrus storage
 */

import { CoreClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { getWallet, getAccount } from '../utils/wallet.js';
import { getUploadRelayUrl, getSuiRpcUrl } from '../utils/settings.js';
import { 
  MAX_EPOCHS, 
  DEFAULT_CONTENT_TYPE,
  PAGE_TITLE_ATTRIBUTE,
  CONTENT_TYPE_ATTRIBUTE,
  WALRUS_NETWORK,
} from '../config/constants.js';

/**
 * Creates a signer wrapper that implements the Sui SDK Signer interface
 * @param {Object} wallet - The wallet instance
 * @param {Object} account - The account object
 * @returns {Object} Signer interface compatible with Sui SDK
 */
function createSigner(wallet, account) {
  return {
    toSuiAddress() {
      return account.address;
    },
    getPublicKey() {
      return account.publicKey;
    },
    async signAndExecuteTransaction({ transaction, client }) {
      // Set sender if not already set
      transaction.setSenderIfNotSet(account.address);
      
      // Build the transaction to get bytes
      const bytes = await transaction.build({ client });
      
      // Sign the transaction bytes using the wallet
      const { signature } = await wallet.features['sui:signTransaction'].signTransaction({
        transaction: {
          toJSON: async () => {
            // Return the transaction JSON for the wallet
            return await transaction.toJSON({ client, supportedIntents: [] });
          }
        },
        account,
        chain: 'sui:mainnet',
      });
      
      // Execute the signed transaction
      const result = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });
      
      // Transform effects.created and effects.mutated to changedObjects format
      if (result.effects && !result.effects.changedObjects && (result.effects.created || result.effects.mutated)) {
        result.effects.changedObjects = [];
        
        if (result.effects.created) {
          result.effects.created.forEach(obj => {
            result.effects.changedObjects.push({
              id: obj.reference.objectId,
              idOperation: 'Created',
              ...obj
            });
          });
        }
        
        if (result.effects.mutated) {
          result.effects.mutated.forEach(obj => {
            result.effects.changedObjects.push({
              id: obj.reference.objectId,
              idOperation: 'Mutated',
              ...obj
            });
          });
        }
      }
      
      return {
        digest: result.digest,
        effects: result.effects,
      };
    },
  };
}

/**
 * Upload content to Walrus storage
 * @param {string} content - The content to upload
 * @param {Object} options - Upload options
 * @param {string} options.title - Optional page title
 * @param {string} options.contentType - Content type (defaults to text/markdown)
 * @param {number} options.epochs - Storage duration in epochs (defaults to MAX_EPOCHS)
 * @param {boolean} options.deletable - Whether blob can be deleted (defaults to false)
 * @returns {Promise<{objectId: string, blobId: string, expiryEpoch: number}>} Upload result
 */
export async function uploadToWalrus(content, options = {}) {
  console.log('🚀 uploadToWalrus called with options:', options);
  
  const { 
    title, 
    contentType = DEFAULT_CONTENT_TYPE,
    epochs = MAX_EPOCHS,
    deletable = false 
  } = options;
  
  const wallet = getWallet();
  const account = getAccount();
  
  if (!wallet || !account) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Convert content to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    
    // Get user-configured URLs
    const suiRpcUrl = getSuiRpcUrl();
    const uploadRelayUrl = getUploadRelayUrl();
    
    // Create SuiClient
    const suiClient = new CoreClient({ url: suiRpcUrl });
    
    console.log('Using upload relay:', uploadRelayUrl);
    console.log('Using Sui RPC:', suiRpcUrl);
    
    // Create Walrus client with upload relay
    const walrusClient = new WalrusClient({
      network: WALRUS_NETWORK,
      suiRpcUrl: suiRpcUrl,
      uploadRelay: {
        host: uploadRelayUrl,
        sendTip: {
          max: 10_000_000,  // 0.01 SUI max tip
        },
      },
    });
    
    // Create signer wrapper
    const signer = createSigner(wallet, account);
    
    // Build attributes object
    const attributes = {
      [CONTENT_TYPE_ATTRIBUTE]: contentType,
    };
    
    if (title) {
      attributes[PAGE_TITLE_ATTRIBUTE] = title;
      console.log('📝 Setting page title attribute:', title);
    }
    
    console.log('📦 Upload attributes:', attributes);
    
    // Upload blob to Walrus
    const result = await walrusClient.writeBlob({
      blob: data,
      deletable,
      epochs,
      signer,
      attributes,
    });
    
    console.log('Walrus writeBlob result:', result);
    
    // Extract the blob object from the transaction effects
    const blobObject = result.blobObject || result.newlyCreatedBlobs?.[0]?.blobObject;
    
    if (!blobObject) {
      console.error('No blob object in result:', result);
      throw new Error('Failed to get blob object from upload result');
    }
    
    const objectId = blobObject.id?.id || blobObject.id;
    console.log('✅ Blob uploaded successfully!');
    console.log('   Object ID:', objectId);
    console.log('   Blob ID:', result.blobId || blobObject.blobId);
    console.log('   Signer address:', account.address);
    
    return {
      objectId: objectId,
      blobId: result.blobId || blobObject.blobId,
      expiryEpoch: blobObject.storage?.end_epoch || blobObject.endEpoch,
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Extend blob storage duration (placeholder for future implementation)
 * @param {string} objectId - Blob object ID
 * @param {number} additionalEpochs - Number of epochs to extend
 * @returns {Promise<void>}
 */
export async function extendBlobStorage(objectId, additionalEpochs = MAX_EPOCHS) {
  const wallet = getWallet();
  const account = getAccount();
  
  if (!wallet || !account) {
    throw new Error('Wallet not connected');
  }
  
  throw new Error('Blob extension implementation in progress. Use batch operations instead.');
}
