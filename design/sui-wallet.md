# Pure JS Sui Wallet Button

How to build a wallet connect/disconnect button for Sui using vanilla JavaScript and the [Wallet Standard](https://github.com/wallet-standard/wallet-standard) — no React, no dApp Kit.

## Dependencies

The only runtime dependency is `@mysten/wallet-standard`:

```
npm install @mysten/wallet-standard
```

This gives you `getWallets()`, a singleton registry that wallet browser extensions (Slush, Sui Wallet, Suiet, etc.) register themselves into.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Page (main.js / admin.js)                          │
│  - wallet button click handler                      │
│  - onAccountChange listener for UI updates          │
├─────────────────────────────────────────────────────┤
│  wallet.js  (core module, shared state)             │
│  - connectWallet / disconnectWallet                 │
│  - restoreWalletConnection (auto-connect)           │
│  - account change detection (events + visibility)   │
│  - localStorage persistence                         │
├──────────────┬──────────────────────────────────────┤
│ wallet-picker│  wallet-dropdown                     │
│ (modal)      │  (popover)                           │
│ - pick wallet│  - show address                      │
│ - pick acct  │  - copy address                      │
│              │  - disconnect                         │
└──────────────┴──────────────────────────────────────┘
```

**Files:**
- `src/utils/wallet.js` — Core wallet state and connection logic
- `src/components/wallet-picker.js` — Modal for choosing wallet / account
- `src/components/wallet-dropdown.js` — Dropdown shown when already connected

## Core Concepts

### Wallet Standard API

Wallet extensions register themselves into a global registry. You query it at runtime:

```js
import { getWallets } from '@mysten/wallet-standard';

const registry = getWallets();     // singleton WalletsApi object
const allWallets = registry.get(); // array of Wallet objects
```

Each wallet object exposes capabilities via `wallet.features`:

| Feature | Purpose |
|---|---|
| `standard:connect` | Request account access |
| `standard:disconnect` | Revoke cached authorization (optional — not all wallets support this) |
| `standard:events` | Subscribe to account/chain changes |
| `sui:signAndExecuteTransactionBlock` | Sign and send transactions |

Each wallet also has:
- `wallet.name` — Display name (e.g. "Slush")
- `wallet.icon` — Base64 data URI or URL for the wallet icon
- `wallet.chains` — Array of supported chains (e.g. `["sui:mainnet", "sui:testnet"]`)
- `wallet.accounts` — Live array of currently authorized account objects (updates in real time)

### Account Objects

The `connect()` call and `wallet.accounts` both return account objects with this shape:

```js
{
  address: "0x1a2b3c...",   // Sui address (hex string, always present)
  publicKey: Uint8Array,     // Public key bytes
  chains: ["sui:mainnet"],   // Chains this account supports
  features: [...],           // Features this account supports
  label: "My Account",      // Optional human-readable label (may be empty)
}
```

For wallet UI, you'll primarily use `address` and optionally `label`.

### Authorization Caching

**This is the most important thing to understand.** When you call `connect()`, the wallet extension remembers the authorization. Subsequent `connect()` calls return cached accounts silently — the user is NOT re-prompted.

To force the wallet to re-prompt (e.g. after disconnect), you **must** call `standard:disconnect`:

```js
wallet.features['standard:disconnect']?.disconnect();
```

Without this, "disconnect then reconnect" will silently reconnect to the same account. Note the optional chaining — not all wallets implement this feature, so always guard the call.

### Filtering for Sui Wallets

The wallet registry contains all Wallet Standard wallets, not just Sui ones. A user might have MetaMask (Ethereum) installed alongside Slush (Sui). Filter by checking `wallet.chains`:

```js
function getSuiWallets() {
  const wallets = getWallets();
  if (!wallets || wallets.get().length === 0) return [];
  return wallets.get().filter(wallet =>
    wallet.chains && wallet.chains.some(chain => chain.startsWith('sui:'))
  );
}
```

This is called fresh on every connect attempt, not cached, because extensions can be installed or enabled while the page is open.

## Module State

All wallet state lives in module-level variables within `wallet.js`. There is no class — just a closure over these variables, with exported functions as the public API:

```js
import { getWallets } from '@mysten/wallet-standard';
import { showWalletPicker, showAccountPicker } from '../components/wallet-picker.js';

let currentWallet = null;           // The Wallet Standard wallet object
let currentAccount = null;          // The selected account object
let unsubscribeEvents = null;       // Cleanup function for event subscription
let accountChangeListeners = new Set(); // Pub/sub listeners for account changes
```

## Connection Flow

### 1. Initial Connect

When the user clicks the connect button:

1. **Discover wallets** — Call `getSuiWallets()` to get a fresh list
2. **Pick a wallet** — If multiple Sui wallets are installed, show a picker modal. If only one, use it directly.
3. **Call `connect()`** — This prompts the user in the extension (first time) or returns cached accounts (subsequent)
4. **Pick an account** — If the wallet returns multiple accounts, show an account picker. If only one, use it directly.
5. **Persist** — Save `wallet.name` and `account.address` to localStorage
6. **Subscribe** — Start listening for account change events

The internal function that connects to a specific wallet:

```js
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
      // User cancelled the account picker
      currentWallet = null;
      return null;
    }
    currentAccount = picked;
  }

  // Persist for auto-connect on next page load
  localStorage.setItem('walrus_wallet_name', wallet.name);
  localStorage.setItem('walrus_wallet_address', currentAccount.address);

  subscribeToWalletEvents(wallet);
  return currentAccount.address;
}
```

The public function that orchestrates discovery, picking, and error recovery:

```js
export async function connectWallet() {
  try {
    const suiWallets = getSuiWallets();

    if (suiWallets.length === 0) {
      throw new Error(
        'No Sui wallet detected. Please install a Sui wallet extension.'
      );
    }

    let wallet;
    if (suiWallets.length === 1) {
      wallet = suiWallets[0];
    } else {
      wallet = await showWalletPicker(suiWallets);
      if (!wallet) {
        return null; // User cancelled the wallet picker
      }
    }

    return await connectToWallet(wallet);
  } catch (error) {
    // Clean up partial state if connect fails mid-way
    // (e.g. currentWallet was set but connect() threw)
    console.error('Error connecting wallet:', error);
    currentWallet = null;
    currentAccount = null;
    throw error;
  }
}
```

**Important:** `connectWallet()` returns `null` when the user cancels (not an error). Callers must check:

```js
const address = await connectWallet();
if (!address) return; // user cancelled — do nothing
```

### 2. Auto-Connect (Restore Session)

On page load, restore the previous session without prompting the user:

1. **Read localStorage** — Get saved `wallet_name` and `wallet_address`
2. **Find the wallet** — Look it up by name in the registry. Retry a few times because extensions load asynchronously after the page.
3. **Call `connect()`** — Since authorization was cached by the extension, this returns accounts silently
4. **Match the account** — Find the previously used account by address in the returned list

```js
export async function restoreWalletConnection() {
  const savedName = localStorage.getItem('walrus_wallet_name');
  const savedAddress = localStorage.getItem('walrus_wallet_address');
  if (!savedName || !savedAddress) return null;

  try {
    // Retry because wallet extensions may still be loading
    let wallet = null;
    for (let i = 0; i < 3; i++) {
      wallet = getWallets().get().find(w => w.name === savedName);
      if (wallet) break;
      if (i < 2) await new Promise(r => setTimeout(r, 500));
    }

    if (!wallet) {
      // Extension was uninstalled or unavailable — clean up
      localStorage.removeItem('walrus_wallet_name');
      localStorage.removeItem('walrus_wallet_address');
      return null;
    }

    currentWallet = wallet;
    const result = await wallet.features['standard:connect'].connect();
    const accounts = result?.accounts || [];

    if (accounts.length === 0) {
      disconnectWallet();
      return null;
    }

    // Prefer the previously used account, fall back to first
    const saved = accounts.find(a => a.address === savedAddress);
    currentAccount = saved || accounts[0];

    // Update in case the saved account is gone and we fell back
    localStorage.setItem('walrus_wallet_address', currentAccount.address);
    subscribeToWalletEvents(wallet);
    return currentAccount.address;
  } catch (error) {
    console.error('Error restoring wallet connection:', error);
    disconnectWallet();
    return null;
  }
}
```

Call this early in `init()` on every page that needs the wallet:

```js
async function init() {
  await restoreWalletConnection();
  updateWalletButton();
  // ...
}
```

Note that `restoreWalletConnection` never throws — it catches errors internally and returns `null`, since a failed auto-connect should not block the page from loading.

### 3. Disconnect

Disconnecting has three parts:

1. **Unsubscribe** from wallet events
2. **Revoke authorization** via `standard:disconnect` — this is what forces the wallet extension to re-prompt on the next `connect()` call. Not all wallets implement this feature, so wrap it in a try/catch with optional chaining.
3. **Clear state** — null out module variables and remove localStorage entries

```js
export function disconnectWallet() {
  // 1. Unsubscribe events
  if (unsubscribeEvents) {
    unsubscribeEvents();
    unsubscribeEvents = null;
  }

  // 2. Revoke authorization so next connect() re-prompts
  if (currentWallet) {
    try {
      currentWallet.features['standard:disconnect']?.disconnect();
    } catch (e) {
      // Not all wallets support disconnect — ignore
    }
  }

  // 3. Clear state
  currentWallet = null;
  currentAccount = null;
  localStorage.removeItem('walrus_wallet_name');
  localStorage.removeItem('walrus_wallet_address');
}
```

### 4. Account Change Detection

Users can switch accounts in their wallet extension at any time. Detection uses two complementary approaches because not all wallets reliably emit events.

#### Approach A: `standard:events` subscription

Subscribe right after connecting. The wallet may emit `change` events when the user switches accounts within the extension:

```js
function subscribeToWalletEvents(wallet) {
  // Clean up any previous subscription
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
```

#### Approach B: Visibility change polling

Some wallets (notably Slush) don't reliably emit `change` events. As a fallback, check the live `wallet.accounts` property whenever the user switches back to the tab:

```js
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkForAccountChange();
  }
});

export function checkForAccountChange() {
  if (!currentWallet || !currentAccount) return;

  const liveAccounts = currentWallet.accounts;
  if (!liveAccounts || liveAccounts.length === 0) return;

  const stillExists = liveAccounts.some(a => a.address === currentAccount.address);
  const activeAccount = liveAccounts[0];

  if (!stillExists || activeAccount.address !== currentAccount.address) {
    currentAccount = activeAccount;
    localStorage.setItem('walrus_wallet_address', activeAccount.address);
    notifyAccountChange(activeAccount.address);
  }
}
```

#### Pub/sub for UI updates

Both detection approaches call `notifyAccountChange`, which dispatches to registered listeners so each page can update its UI:

```js
function notifyAccountChange(address) {
  for (const listener of accountChangeListeners) {
    try {
      listener(address);
    } catch (e) {
      console.error('Account change listener error:', e);
    }
  }
}

export function onAccountChange(listener) {
  accountChangeListeners.add(listener);
  return () => accountChangeListeners.delete(listener);
}
```

Pages register a listener during init:

```js
// In page init()
onAccountChange((newAddress) => {
  updateWalletButton(true, newAddress);
});
```

## localStorage Keys

| Key | Value | Purpose |
|---|---|---|
| `walrus_wallet_name` | `"Slush"` | Find the wallet object by name on restore |
| `walrus_wallet_address` | `"0x1a2b..."` | Match the previously selected account |

Both are cleared on disconnect. The address is updated whenever the account changes (via events or visibility polling).

## UI Components

### Wallet Picker Modal

A reusable promise-based modal. A single internal `showPickerModal()` function handles both wallet selection and account selection — it just receives different `items`:

Key patterns:
- **Lazy DOM creation** — The modal element is created once on first use and reused for subsequent calls
- **Promise-based** — `showPickerModal()` returns a Promise that resolves to the selected item or `null` on cancel
- **Proper cleanup** — Event listeners (close button, backdrop click, Escape key) are removed when the modal closes, preventing leaks

```js
export function showWalletPicker(wallets) {
  return showPickerModal({
    title: 'Connect Wallet',
    subtitle: 'Choose a wallet to connect',
    hint: 'Don\'t have a wallet? <a href="https://sui.io/get-started">Get a Sui wallet</a>',
    items: wallets.map(w => ({
      iconSrc: w.icon || '',
      label: w.name,
      value: w,           // resolve with the wallet object
    })),
  });
}

export function showAccountPicker(accounts) {
  return showPickerModal({
    title: 'Select Account',
    subtitle: 'Choose an account to use',
    hint: null,
    items: accounts.map(a => ({
      iconSrc: '',
      label: formatAddress(a.address), // "0x1a2b...3c4d"
      sublabel: a.label || '',
      value: a,           // resolve with the account object
    })),
  });
}
```

Each item in the list is rendered as a `<button>` with optional icon, label, and sublabel. Clicking an item resolves the promise with its `value`. Closing the modal (X button, backdrop click, Escape) resolves with `null`.

### Wallet Dropdown

Shown when clicking the wallet button while already connected:

- Displays the full address (click to copy to clipboard)
- "Disconnect" button
- Closes on outside click or Escape
- Positioned with `fixed` positioning relative to the wallet button via `getBoundingClientRect()`
- Uses `requestAnimationFrame` to defer the outside-click listener by one frame, preventing the opening click from immediately closing the dropdown
- All event listeners are tracked in a single `cleanupFn` and removed on close to prevent leaks

### Wallet Button State Machine

The wallet button in the navbar has three states:

| State | Display | Click Action |
|---|---|---|
| Disconnected | "Connect Wallet" | Start connect flow (shows picker if multiple wallets) |
| Connected, dropdown closed | Truncated address (e.g. "0x1a2b...3c4d") | Open dropdown |
| Connected, dropdown open | Truncated address | Close dropdown |

```js
async function toggleWallet() {
  if (isWalletConnected()) {
    if (isWalletDropdownOpen()) {
      hideWalletDropdown();
    } else {
      showWalletDropdown({
        address: getWalletAddress(),
        onDisconnect() {
          disconnectWallet();
          updateWalletButton(false);
        },
      });
    }
  } else {
    const address = await connectWallet();
    if (!address) return; // user cancelled
    updateWalletButton(true, address);
  }
}
```

## Public API Summary

Exported from `wallet.js`:

| Function | Returns | Description |
|---|---|---|
| `connectWallet()` | `Promise<string\|null>` | Full connect flow. Returns address or `null` if cancelled. |
| `disconnectWallet()` | `void` | Revokes auth, clears state, removes localStorage. |
| `restoreWalletConnection()` | `Promise<string\|null>` | Auto-connect from localStorage. Never throws. |
| `isWalletConnected()` | `boolean` | Whether both wallet and account are set. |
| `getWalletAddress()` | `string\|null` | Current account address. |
| `getWallet()` | `object\|null` | Raw Wallet Standard wallet object (for transactions). |
| `getAccount()` | `object\|null` | Raw account object (for transactions). |
| `onAccountChange(fn)` | `function` | Subscribe to account switches. Returns unsubscribe function. |
| `checkForAccountChange()` | `void` | Manually check for account change (called automatically on visibility change). |

## Gotchas

1. **`connect()` caches authorization.** Calling `connect()` again after a previous successful connect returns cached accounts silently. You must call `standard:disconnect` during disconnect if you want the next `connect()` to re-prompt the user.

2. **Wallet extensions load asynchronously.** On page load, the wallet registry may be empty because extensions inject themselves after the DOM is ready. Use a retry loop with short delays (e.g. 3 attempts, 500ms apart) in `restoreWalletConnection`.

3. **`standard:events` is unreliable.** Some wallets (notably Slush) don't reliably emit `change` events when the user switches accounts. Always implement the `visibilitychange` polling fallback alongside event subscription.

4. **`wallet.accounts` is live.** It reflects the current state of authorized accounts in the extension and updates in real time. This is what makes the visibility-change polling approach work — you don't need to call `connect()` again to see changes.

5. **`connect()` returns ALL authorized accounts**, not just the "active" one. There is no Wallet Standard concept of an "active" account — the first account in the list is conventionally the primary one, but this is wallet-dependent.

6. **Cancel handling.** Both `connectWallet()` and the picker modals return `null` (not an error) when the user cancels. Every caller must check: `if (!address) return;`

7. **Don't show loading overlays before `connectWallet()`.** The wallet extension opens its own popup, and your picker modals also need to be interactive. A loading overlay on your page will block the user from clicking anything.

8. **`standard:disconnect` is optional.** Not all wallets implement this feature. Always use optional chaining (`?.disconnect()`) and wrap in try/catch. If a wallet doesn't support it, the user may need to revoke access manually in the extension settings.

9. **Clean up partial state on error.** If `connect()` throws mid-way (e.g. user rejects in the extension), `currentWallet` may already be set. The `connectWallet()` catch block must reset both `currentWallet` and `currentAccount` to `null` to avoid an inconsistent state where `isWalletConnected()` returns false but `currentWallet` is not null.

10. **`restoreWalletConnection` should never throw.** It wraps everything in try/catch and returns `null` on failure, since a failed auto-connect should not block page initialization. If the saved wallet is gone, it cleans up localStorage gracefully.
