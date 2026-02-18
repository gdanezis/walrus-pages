/**
 * Wallet Module - Sui wallet connection using Wallet Standard
 */

import { getWallets } from '@mysten/wallet-standard';
import { showWalletPicker, showAccountPicker } from '../components/wallet-picker.js';

let currentWallet = null;
let currentAccount = null;
let unsubscribeEvents = null;
let accountChangeListeners = new Set();

/**
 * Subscribe to wallet account changes (e.g. user switches account in extension).
 * Listener receives the new address string.
 * @param {function} listener
 * @returns {function} unsubscribe
 */
export function onAccountChange(listener) {
  accountChangeListeners.add(listener);
  return () => accountChangeListeners.delete(listener);
}

function notifyAccountChange(address) {
  for (const listener of accountChangeListeners) {
    try { listener(address); } catch (e) { console.error('Account change listener error:', e); }
  }
}

function subscribeToWalletEvents(wallet) {
  // Clean up previous subscription
  if (unsubscribeEvents) {
    unsubscribeEvents();
    unsubscribeEvents = null;
  }

  const events = wallet.features['standard:events'];
  if (!events) return;

  unsubscribeEvents = events.on('change', ({ accounts }) => {
    if (!accounts || accounts.length === 0) return;

    const newAccount = accounts[0];
    if (currentAccount && newAccount.address !== currentAccount.address) {
      currentAccount = newAccount;
      localStorage.setItem('walrus_wallet_address', newAccount.address);
      notifyAccountChange(newAccount.address);
    }
  });
}

/**
 * Check if the wallet's active account has changed by reading wallet.accounts directly.
 * Called automatically on page focus.
 */
export function checkForAccountChange() {
  if (!currentWallet || !currentAccount) return;

  // wallet.accounts is a live property on Wallet Standard wallets
  const liveAccounts = currentWallet.accounts;
  if (!liveAccounts || liveAccounts.length === 0) return;

  // Check if our current account is still in the wallet's list
  const stillExists = liveAccounts.some(a => a.address === currentAccount.address);

  // The first account in the list is typically the wallet's "active" account
  const activeAccount = liveAccounts[0];

  if (!stillExists || activeAccount.address !== currentAccount.address) {
    currentAccount = activeAccount;
    localStorage.setItem('walrus_wallet_address', activeAccount.address);
    notifyAccountChange(activeAccount.address);
  }
}

// Check for account changes when the page regains focus
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkForAccountChange();
  }
});

function getSuiWallets() {
  const wallets = getWallets();
  if (!wallets || wallets.get().length === 0) {
    return [];
  }
  return wallets.get().filter(wallet =>
    wallet.chains && wallet.chains.some(chain => chain.startsWith('sui:'))
  );
}

async function connectToWallet(wallet) {
  currentWallet = wallet;

  const result = await wallet.features['standard:connect'].connect();
  const accounts = result?.accounts || [];

  if (accounts.length === 0) {
    throw new Error('No accounts found in wallet');
  }

  // Let the user pick when there are multiple accounts
  if (accounts.length === 1) {
    currentAccount = accounts[0];
  } else {
    const picked = await showAccountPicker(accounts);
    if (!picked) {
      // User cancelled account picker
      currentWallet = null;
      return null;
    }
    currentAccount = picked;
  }

  // Save connection state to localStorage
  localStorage.setItem('walrus_wallet_name', wallet.name);
  localStorage.setItem('walrus_wallet_address', currentAccount.address);

  // Listen for account changes (user switches account in wallet extension)
  subscribeToWalletEvents(wallet);

  return currentAccount.address;
}

export async function connectWallet() {
  try {
    const suiWallets = getSuiWallets();

    if (suiWallets.length === 0) {
      throw new Error('No Sui wallet detected. Please install a Sui wallet extension like Slush, Sui Wallet, or Suiet.');
    }

    let wallet;
    if (suiWallets.length === 1) {
      wallet = suiWallets[0];
    } else {
      wallet = await showWalletPicker(suiWallets);
      if (!wallet) {
        // User cancelled the picker
        return null;
      }
    }

    return await connectToWallet(wallet);
  } catch (error) {
    console.error('Error connecting wallet:', error);
    currentWallet = null;
    currentAccount = null;
    throw error;
  }
}

export function disconnectWallet() {
  if (unsubscribeEvents) {
    unsubscribeEvents();
    unsubscribeEvents = null;
  }

  // Tell the wallet extension to revoke authorization so the next
  // connect() will prompt the user to pick an account again.
  if (currentWallet) {
    try {
      currentWallet.features['standard:disconnect']?.disconnect();
    } catch (e) {
      // Not all wallets support disconnect — ignore errors
    }
  }

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
    const result = await wallet.features['standard:connect'].connect();
    const accounts = result?.accounts || [];

    if (accounts.length === 0) {
      disconnectWallet();
      return null;
    }

    // Try to find the previously used account
    const savedAccount = accounts.find(a => a.address === savedAddress);
    currentAccount = savedAccount || accounts[0];

    // Update saved address in case it changed
    localStorage.setItem('walrus_wallet_address', currentAccount.address);

    // Listen for future account changes
    subscribeToWalletEvents(wallet);

    return currentAccount.address;
  } catch (error) {
    console.error('Error restoring wallet connection:', error);
    disconnectWallet();
    return null;
  }
}
