/**
 * Wallet Dropdown - Shows wallet info and disconnect option when connected
 */

let dropdownEl = null;
let cleanupFn = null;

function createDropdown() {
  if (dropdownEl) return dropdownEl;

  dropdownEl = document.createElement('div');
  dropdownEl.id = 'wallet-dropdown';
  dropdownEl.className = 'wallet-dropdown hidden';
  dropdownEl.innerHTML = `
    <div class="wallet-dropdown-address" data-wallet-copy>
      <span class="wallet-dropdown-address-text"></span>
      <span class="wallet-dropdown-copy-hint">Click to copy</span>
    </div>
    <button class="wallet-dropdown-disconnect" data-wallet-disconnect>Disconnect</button>
  `;

  document.body.appendChild(dropdownEl);
  return dropdownEl;
}

/**
 * Show the wallet dropdown anchored to the wallet button.
 * @param {object} options
 * @param {string} options.address - The connected wallet address
 * @param {function} options.onDisconnect - Called when user clicks disconnect
 */
export function showWalletDropdown({ address, onDisconnect }) {
  // Close any existing dropdown first
  hideWalletDropdown();

  const dropdown = createDropdown();
  const addressText = dropdown.querySelector('.wallet-dropdown-address-text');
  const copyBtn = dropdown.querySelector('[data-wallet-copy]');
  const copyHint = dropdown.querySelector('.wallet-dropdown-copy-hint');
  const disconnectBtn = dropdown.querySelector('[data-wallet-disconnect]');

  addressText.textContent = address;

  // Position relative to wallet button
  const walletBtn = document.getElementById('wallet-btn');
  if (walletBtn) {
    const rect = walletBtn.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 8}px`;
    dropdown.style.right = `${document.documentElement.clientWidth - rect.right}px`;
  }

  function onCopy() {
    navigator.clipboard.writeText(address).then(() => {
      copyHint.textContent = 'Copied!';
      setTimeout(() => { copyHint.textContent = 'Click to copy'; }, 1500);
    });
  }

  function onDisconnectClick() {
    hideWalletDropdown();
    onDisconnect();
  }

  function onOutsideClick(e) {
    if (!dropdown.contains(e.target) && e.target.id !== 'wallet-btn') {
      hideWalletDropdown();
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      hideWalletDropdown();
    }
  }

  copyBtn.addEventListener('click', onCopy);
  disconnectBtn.addEventListener('click', onDisconnectClick);
  // Delay adding outside click listener to avoid the current click closing it
  requestAnimationFrame(() => {
    document.addEventListener('click', onOutsideClick);
  });
  document.addEventListener('keydown', onKeydown);

  cleanupFn = () => {
    copyBtn.removeEventListener('click', onCopy);
    disconnectBtn.removeEventListener('click', onDisconnectClick);
    document.removeEventListener('click', onOutsideClick);
    document.removeEventListener('keydown', onKeydown);
    cleanupFn = null;
  };

  dropdown.classList.remove('hidden');
}

export function hideWalletDropdown() {
  if (cleanupFn) cleanupFn();
  if (dropdownEl) dropdownEl.classList.add('hidden');
}

export function isWalletDropdownOpen() {
  return dropdownEl && !dropdownEl.classList.contains('hidden');
}
