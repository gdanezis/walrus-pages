/**
 * Shared wallet state bridge between React dApp Kit and vanilla JS modules.
 */

const listeners = new Set();

let walletState = {
  wallet: null,
  account: null,
  status: 'disconnected',
  disconnect: null,
  signAndExecute: null,
};

let isInitialized = false;
let readyResolver;

const readyPromise = new Promise((resolve) => {
  readyResolver = resolve;
});

function notifyListeners() {
  for (const listener of listeners) {
    listener(walletState);
  }
}

export function updateWalletBridgeState(partialState) {
  walletState = { ...walletState, ...partialState };
  if (!isInitialized) {
    isInitialized = true;
    readyResolver?.();
  }
  notifyListeners();
}

export function getWalletBridgeState() {
  return walletState;
}

export function subscribeToWalletBridge(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function waitForWalletBridgeReady() {
  return readyPromise;
}
