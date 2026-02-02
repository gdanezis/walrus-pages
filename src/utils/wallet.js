import {
  getWalletBridgeState,
  subscribeToWalletBridge,
  waitForWalletBridgeReady,
} from '../dapp-kit/wallet-state.js';

let currentWallet = null;
let currentAccount = null;
let disconnectFn = null;
let signAndExecuteFn = null;
let connectionStatus = 'disconnected';

const walletListeners = new Set();

function getSnapshot() {
  return {
    wallet: currentWallet,
    account: currentAccount,
    status: connectionStatus,
    isConnected: isWalletConnected(),
    address: currentAccount?.address ?? null,
  };
}

function notifyWalletListeners() {
  const snapshot = getSnapshot();
  for (const listener of walletListeners) {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('Wallet listener error:', error);
    }
  }
}

function handleBridgeUpdate(state) {
  currentWallet = state.wallet ?? null;
  currentAccount = state.account ?? null;
  disconnectFn = state.disconnect ?? null;
  signAndExecuteFn = state.signAndExecute ?? null;
  connectionStatus = state.status ?? 'disconnected';
  notifyWalletListeners();
}

handleBridgeUpdate(getWalletBridgeState());
subscribeToWalletBridge(handleBridgeUpdate);

export function subscribeToWalletChanges(listener) {
  walletListeners.add(listener);
  // Immediately invoke listener with current state for convenience
  listener(getSnapshot());
  return () => {
    walletListeners.delete(listener);
  };
}

export async function connectWallet() {
  if (isWalletConnected()) {
    return currentAccount.address;
  }

  const trigger = document.querySelector('[data-wallet-connect-trigger]');
  if (!trigger) {
    throw new Error('Wallet connect button is not available yet. Please try again shortly.');
  }

  trigger.click();

  return waitForConnection();
}

function waitForConnection(timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    if (isWalletConnected()) {
      resolve(currentAccount.address);
      return;
    }

    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        unsubscribe();
        reject(new Error('Wallet connection timed out'));
      }
    }, timeoutMs);

    const unsubscribe = subscribeToWalletChanges((snapshot) => {
      if (snapshot.isConnected && snapshot.address) {
        resolved = true;
        clearTimeout(timeout);
        unsubscribe();
        resolve(snapshot.address);
      }
    });
  });
}

export async function disconnectWallet() {
  if (disconnectFn) {
    await disconnectFn();
  }
}

export function getWalletAddress() {
  return currentAccount?.address ?? null;
}

export function isWalletConnected() {
  return Boolean(currentWallet && currentAccount);
}

export async function signAndExecuteTransaction(transaction) {
  if (!signAndExecuteFn) {
    throw new Error('Wallet not connected');
  }

  return signAndExecuteFn({
    transaction,
    chain: 'sui:mainnet',
  });
}

export function getWallet() {
  return currentWallet;
}

export function getAccount() {
  return currentAccount;
}

export async function restoreWalletConnection() {
  await waitForWalletBridgeReady();
  return getWalletAddress();
}
