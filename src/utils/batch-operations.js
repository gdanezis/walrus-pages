/**
 * Batch Operations Module - PTB for extending and deleting multiple blobs
 */

import { Transaction } from '@mysten/sui/transactions';
import { WalrusClient } from '@mysten/walrus';
import { CoreClient } from '@mysten/sui/client';
import { getWallet, getAccount, signAndExecuteTransaction } from './wallet.js';
import { getSuiRpcUrl } from './settings.js';
import { 
  WAL_COIN_TYPE,
  WALRUS_NETWORK 
} from '../config/constants.js';

/**
 * Extend multiple blobs in a single transaction using WalrusClient SDK
 * @param {Array} blobObjects - Array of blob objects with objectId, version, and digest
 * @param {number} extendedEpochs - Number of epochs to extend (default 5)
 */
export async function extendBlobsBatch(blobObjects, extendedEpochs = 5) {
  const wallet = getWallet();
  const account = getAccount();
  
  if (!wallet || !account) {
    throw new Error('Wallet not connected');
  }
  
  if (!blobObjects || blobObjects.length === 0) {
    throw new Error('No blobs to extend');
  }
  
  console.log(`Extending ${blobObjects.length} blobs for up to ${extendedEpochs} epochs using WalrusClient SDK`);
  
  try {
    const suiRpcUrl = getSuiRpcUrl();
    const client = new CoreClient({ url: suiRpcUrl });
    const walrusClient = new WalrusClient({
      network: 'mainnet',
      suiRpcUrl: suiRpcUrl,
    });
    
    // Get current system state to determine current epoch and max_epochs_ahead
    console.log('Fetching Walrus system state...');
    const systemState = await walrusClient.systemState();
    const currentEpoch = systemState.committee.epoch;
    
    // Max epochs ahead offset is 52 epochs from current
    const maxEpochsAheadOffset = 52;
    
    console.log(`Current epoch: ${currentEpoch}, Max epochs ahead offset: ${maxEpochsAheadOffset}`);
    
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(500_000_000); // 0.5 SUI for gas
    
    // Calculate safe extension epochs for each blob individually
    console.log('Calculating safe extension for each blob...');
    const extensionPlan = [];
    
    for (const blob of blobObjects) {
      // Calculate current offset: how many epochs until blob expires
      const startOffset = blob.expiryEpoch - currentEpoch;
      
      // Calculate maximum safe extension for this blob
      const maxSafeExtend = maxEpochsAheadOffset - startOffset;
      
      // Use the minimum of requested epochs and what's safe
      const safeEpochs = Math.min(extendedEpochs, maxSafeExtend);
      
      if (safeEpochs <= 0) {
        console.warn(`⚠️ Blob ${blob.objectId} - SKIPPED: already at/beyond max_epochs_ahead (end_epoch: ${blob.expiryEpoch}, offset: ${startOffset}, max: ${maxEpochsAheadOffset})`);
        continue; // Skip this blob
      }
      
      extensionPlan.push({
        blob,
        epochs: safeEpochs,
        currentOffset: startOffset,
      });
      
      console.log(`✓ Blob ${blob.objectId} - end_epoch: ${blob.expiryEpoch}, extending by: ${safeEpochs} epochs (offset: ${startOffset}/${maxEpochsAheadOffset})`);
    }
    
    if (extensionPlan.length === 0) {
      throw new Error('No blobs can be extended - all are already at or beyond max_epochs_ahead limit');
    }
    
    console.log(`Will extend ${extensionPlan.length} of ${blobObjects.length} blob(s)`);
    
    // Set the sender before building operations
    tx.setSender(account.address);
    
    // Get the system object ID for direct Move calls
    const systemObject = await walrusClient.systemObject();
    const systemObjectId = systemObject.id.id;
    console.log('System object from Walrus client:', systemObject);
    
    // Get the active package ID from the system object
    // This ensures we're always calling the latest version of the Walrus package
    const walrusPackageId = systemObject.package_id;
    console.log('Using Walrus package ID from system object:', walrusPackageId);
    
    // Fetch the full system object to get the correct initial_shared_version
    const fullSystemObject = await client.getObject({
      id: systemObjectId,
      options: { showOwner: true }
    });
    
    const initialSharedVersion = fullSystemObject.data.owner.Shared.initial_shared_version;
    console.log('System object initial_shared_version:', initialSharedVersion);
    
    // Create a proper shared object reference with the correct initial_shared_version
    const systemObjRef = tx.sharedObjectRef({
      objectId: systemObjectId,
      initialSharedVersion: initialSharedVersion,
      mutable: true,
    });
    
    // Get and merge WAL coins for payment
    let walCoins = await client.getCoins({
      owner: account.address,
      coinType: WAL_COIN_TYPE,
    });
    
    if (!walCoins.data || walCoins.data.length === 0) {
      throw new Error('No WAL coins found');
    }
    
    // Estimate payment needed (generous estimate: 1 WAL per blob per epoch)
    const estimatedPayment = extensionPlan.reduce((sum, plan) => sum + plan.epochs, 0) * 1_000_000_000;
    console.log(`Estimated payment needed: ${estimatedPayment} MIST`);
    
    // Select only enough coins to cover the payment
    let coinsToMerge = [];
    let totalBalance = 0;
    
    for (const coin of walCoins.data) {
      coinsToMerge.push(coin);
      totalBalance += parseInt(coin.balance);
      if (totalBalance >= estimatedPayment) {
        break;
      }
    }
    
    console.log(`Using ${coinsToMerge.length} of ${walCoins.data.length} WAL coins (total: ${totalBalance} MIST)`);
    
    if (totalBalance < estimatedPayment) {
      throw new Error(`Insufficient WAL balance. Need ~${estimatedPayment / 1e9} WAL, but only have ${totalBalance / 1e9} WAL`);
    }
    
    // Use the first coin as primary, merge only the selected coins into it
    const [primaryCoin, ...otherCoins] = coinsToMerge.map(c => c.coinObjectId);
    
    let walCoinRef = tx.object(primaryCoin);
    
    if (otherCoins.length > 0) {
      console.log(`Merging ${otherCoins.length} additional WAL coins`);
      tx.mergeCoins(walCoinRef, otherCoins.map(id => tx.object(id)));
    }
    
    // Call extend_blob Move function directly for each blob with the WAL coin
    for (const plan of extensionPlan) {
      tx.moveCall({
        target: `${walrusPackageId}::system::extend_blob`,
        arguments: [
          systemObjRef,  // Use the shared object reference with version info
          tx.object(plan.blob.objectId),
          tx.pure.u32(plan.epochs),
          walCoinRef,  // Pass the WAL coin for payment
        ],
      });
    }
    
    // Print transaction summary before execution
    console.log('=== TRANSACTION SUMMARY ===');
    console.log('Operations:');
    extensionPlan.forEach((plan, i) => {
      console.log(`  ${i + 1}. Extend blob ${plan.blob.objectId.slice(0, 10)}... by ${plan.epochs} epochs`);
    });
    console.log(`Total blobs: ${extensionPlan.length}`);
    console.log(`Total epochs: ${extensionPlan.reduce((sum, p) => sum + p.epochs, 0)}`);
    console.log(`Estimated cost: ~${extensionPlan.reduce((sum, p) => sum + p.epochs, 0)} WAL`);
    console.log('System object:', systemObjectId);
    console.log('WAL coins used:', coinsToMerge.length);
    console.log('=== REQUESTING APPROVAL ===');
    
    // Execute the transaction directly
    console.log('Executing extend transaction...');
    const result = await signAndExecuteTransaction(tx);
    
    console.log('Extend transaction result:', result);
    return result;
    
  } catch (error) {
    console.error('Error in extendBlobsBatch:', error);
    throw error;
  }
}

/**
 * Delete multiple blobs in a single transaction using blob::burn
 * @param {Array} blobObjects - Array of blob objects with objectId, version, and digest
 */
export async function deleteBlobsBatch(blobObjects) {
  const wallet = getWallet();
  const account = getAccount();
  
  if (!wallet || !account) {
    throw new Error('Wallet not connected');
  }
  
  if (!blobObjects || blobObjects.length === 0) {
    throw new Error('No blobs to delete');
  }
  
  console.log(`Burning ${blobObjects.length} blob(s)`);
  
  try {
    const suiRpcUrl = getSuiRpcUrl();
    const walrusClient = new WalrusClient({
      network: WALRUS_NETWORK,
      suiRpcUrl: suiRpcUrl,
    });
    
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(100_000_000); // 0.1 SUI
    
    // Get the active package ID from the system object
    const systemObject = await walrusClient.systemObject();
    const walrusPackageId = systemObject.package_id;
    console.log('Using Walrus package ID from system object:', walrusPackageId);
    
    // Burn each blob - no System object or epoch checking needed
    for (const blob of blobObjects) {
      console.log('Adding burn for blob:', blob.objectId);
      
      // Call blob::burn which allows owner to destroy the blob at any time
      tx.moveCall({
        target: `${walrusPackageId}::blob::burn`,
        arguments: [
          tx.object(blob.objectId),
        ],
      });
    }
    
    // Execute transaction
    console.log('Executing delete transaction...');
    const result = await signAndExecuteTransaction(tx);
    
    console.log('Delete transaction result:', result);
    return result;
    
  } catch (error) {
    console.error('Error in deleteBlobsBatch:', error);
    throw error;
  }
}
