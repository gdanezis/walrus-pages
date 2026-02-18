/**
 * Wallet & Account Picker Modals - Vanilla JS components for selecting a Sui wallet and account
 */

let modalEl = null;

function getOrCreateModal() {
  if (modalEl) return modalEl;

  modalEl = document.createElement('div');
  modalEl.id = 'wallet-picker-modal';
  modalEl.className = 'modal hidden';
  modalEl.innerHTML = `
    <div class="modal-content wallet-picker-content">
      <div class="modal-header">
        <h2 data-picker-title>Connect Wallet</h2>
        <button class="btn-close" data-picker-close>&times;</button>
      </div>
      <div class="wallet-picker-body">
        <p class="wallet-picker-subtitle" data-picker-subtitle>Choose a wallet to connect</p>
        <div class="wallet-picker-list" data-picker-list></div>
        <p class="wallet-picker-hint" data-picker-hint>
          Don't have a wallet? <a href="https://sui.io/get-started" target="_blank" rel="noopener">Get a Sui wallet</a>
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);
  return modalEl;
}

function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Show a generic picker modal. Returns the selected item or null on cancel.
 */
function showPickerModal({ title, subtitle, hint, items }) {
  return new Promise((resolve) => {
    const modal = getOrCreateModal();
    modal.querySelector('[data-picker-title]').textContent = title;
    modal.querySelector('[data-picker-subtitle]').textContent = subtitle;

    const hintEl = modal.querySelector('[data-picker-hint]');
    if (hint) {
      hintEl.innerHTML = hint;
      hintEl.style.display = '';
    } else {
      hintEl.style.display = 'none';
    }

    const list = modal.querySelector('[data-picker-list]');
    list.innerHTML = '';

    for (const { iconSrc, label, sublabel, value } of items) {
      const item = document.createElement('button');
      item.className = 'wallet-picker-item';
      item.type = 'button';

      if (iconSrc) {
        const icon = document.createElement('img');
        icon.className = 'wallet-picker-icon';
        icon.src = iconSrc;
        icon.alt = label;
        icon.width = 32;
        icon.height = 32;
        icon.onerror = () => { icon.style.display = 'none'; };
        item.appendChild(icon);
      }

      const textContainer = document.createElement('div');
      textContainer.className = 'wallet-picker-item-text';

      const name = document.createElement('span');
      name.className = 'wallet-picker-name';
      name.textContent = label;
      textContainer.appendChild(name);

      if (sublabel) {
        const sub = document.createElement('span');
        sub.className = 'wallet-picker-sublabel';
        sub.textContent = sublabel;
        textContainer.appendChild(sub);
      }

      item.appendChild(textContainer);

      item.addEventListener('click', () => {
        cleanup();
        resolve(value);
      });

      list.appendChild(item);
    }

    const closeBtn = modal.querySelector('[data-picker-close]');

    function onClose() {
      cleanup();
      resolve(null);
    }

    function onBackdropClick(e) {
      if (e.target === modal) onClose();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') onClose();
    }

    function cleanup() {
      modal.classList.add('hidden');
      closeBtn.removeEventListener('click', onClose);
      modal.removeEventListener('click', onBackdropClick);
      document.removeEventListener('keydown', onKeydown);
    }

    closeBtn.addEventListener('click', onClose);
    modal.addEventListener('click', onBackdropClick);
    document.addEventListener('keydown', onKeydown);

    modal.classList.remove('hidden');
  });
}

/**
 * Show the wallet picker modal.
 * @param {Array} wallets - Wallet Standard wallet objects
 * @returns {Promise<object|null>} Selected wallet or null
 */
export function showWalletPicker(wallets) {
  return showPickerModal({
    title: 'Connect Wallet',
    subtitle: 'Choose a wallet to connect',
    hint: 'Don\'t have a wallet? <a href="https://sui.io/get-started" target="_blank" rel="noopener">Get a Sui wallet</a>',
    items: wallets.map(wallet => ({
      iconSrc: wallet.icon || '',
      label: wallet.name,
      value: wallet,
    })),
  });
}

/**
 * Show the account picker modal.
 * @param {Array} accounts - Wallet Standard account objects (must have .address)
 * @returns {Promise<object|null>} Selected account or null
 */
export function showAccountPicker(accounts) {
  return showPickerModal({
    title: 'Select Account',
    subtitle: 'Choose an account to use',
    hint: null,
    items: accounts.map(account => ({
      iconSrc: '',
      label: formatAddress(account.address),
      sublabel: account.label || '',
      value: account,
    })),
  });
}
