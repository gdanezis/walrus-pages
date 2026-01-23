/**
 * Wallet Module - Sui wallet connection using Wallet Standard
 */

import { getWallets } from '@mysten/wallet-standard';

let currentWallet = null;
let currentAccount = null;

export async function connectWallet() {
  try {
    // Get available wallets using Wallet Standard
    const wallets = getWallets();
    
    if (!wallets || wallets.get().length === 0) {
      throw new Error('No Sui wallet detected. Please install a Sui wallet extension like Sui Wallet or Suiet.');
    }
    
    // Filter for Sui-compatible wallets by checking chains
    const allWallets = wallets.get();
    const suiWallets = allWallets.filter(wallet => {
      // Check if wallet supports Sui chains
      return wallet.chains && wallet.chains.some(chain => 
        chain.startsWith('sui:')
      );
    });
    
    if (suiWallets.length === 0) {
      throw new Error('No Sui wallet detected. Please install a Sui wallet extension like Slush, Sui Wallet, or Suiet.');
    }
    
    // Use first available Sui wallet
    const wallet = suiWallets[0];
    currentWallet = wallet;
    
    console.log('Connecting to wallet:', wallet.name);
    
    // Request account access
    const accounts = await wallet.features['standard:connect'].connect();
    
    if (!accounts || accounts.accounts.length === 0) {
      throw new Error('No accounts found in wallet');
    }
    
    currentAccount = accounts.accounts[0];
    
    // Save connection state to localStorage
    localStorage.setItem('walrus_wallet_name', wallet.name);
    localStorage.setItem('walrus_wallet_address', currentAccount.address);
    
    return currentAccount.address;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    currentWallet = null;
    currentAccount = null;
    throw error;
  }
}

export function disconnectWallet() {
  currentWallet = null;
  currentAccount = null;
  localStorage.removeItem('walrus_wallet_name');
  localStorage.removeItem('walrus_wallet_address');
}

export function getWalletAddress() {
  return currentAccount?.address || null;
}

export function isWalletConnected() {
  return currentWallet !== null && currentAccount !== null;
}

export async function signAndExecuteTransaction(transaction) {
  if (!currentWallet || !currentAccount) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Use the wallet's signAndExecuteTransactionBlock feature
    const result = await currentWallet.features['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock({
      transactionBlock: transaction,
      account: currentAccount,
      chain: 'sui:mainnet',
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
      requestType: 'WaitForLocalExecution',
    });
    
    return result;
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

export function getWallet() {
  return currentWallet;
}

export function getAccount() {
  return currentAccount;
}

export async function restoreWalletConnection() {
  const savedWalletName = localStorage.getItem('walrus_wallet_name');
  const savedAddress = localStorage.getItem('walrus_wallet_address');
  
  if (!savedWalletName || !savedAddress) {
    return null;
  }
  
  try {
    // Try to find the wallet with retries (wallet extensions may load slowly)
    let wallet = null;
    const maxRetries = 3;
    
    for (let i = 0; i < maxRetries; i++) {
      const wallets = getWallets();
      const allWallets = wallets.get();
      
      wallet = allWallets.find(w => w.name === savedWalletName);
      
      if (wallet) {
        break;
      }
      
      // Wait a bit before retrying (wallet extension might still be loading)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!wallet) {
      // Wallet not found, clear saved data
      localStorage.removeItem('walrus_wallet_name');
      localStorage.removeItem('walrus_wallet_address');
      return null;
    }
    
    currentWallet = wallet;
    
    // Try to reconnect
    const accounts = await wallet.features['standard:connect'].connect();
    
    if (!accounts || accounts.accounts.length === 0) {
      disconnectWallet();
      return null;
    }
    
    currentAccount = accounts.accounts[0];
    
    // Verify address matches
    if (currentAccount.address !== savedAddress) {
      disconnectWallet();
      return null;
    }
    
    return currentAccount.address;
  } catch (error) {
    console.error('Error restoring wallet connection:', error);
    disconnectWallet();
    return null;
  }
}
