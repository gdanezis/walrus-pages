/**
 * Notifications Module
 * Centralized UI feedback and notification functions
 * Consolidates duplicate code from ui.js and admin.js
 */

/**
 * Shows a loading overlay with a custom message
 * @param {string} message - The loading message to display
 */
export function showLoading(message = 'Processing...') {
  const overlay = document.getElementById('loading-overlay');
  const messageEl = document.getElementById('loading-message');
  
  if (overlay && messageEl) {
    messageEl.textContent = message;
    overlay.classList.remove('hidden');
  } else {
    // Fallback for admin page or other pages without overlay
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.textContent = message;
      loadingEl.style.display = 'block';
    }
  }
}

/**
 * Hides the loading overlay
 */
export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  } else {
    // Fallback for admin page
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }
}

/**
 * Displays an error message to the user
 * @param {string} message - The error message to display
 */
export function showError(message) {
  // Try to use error element first (admin page)
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  } else {
    // Log to console instead of showing alert
    console.error('Error:', message);
    showToast(message, 'error');
  }
  
  hideLoading();
}

/**
 * Displays a success message to the user
 * @param {string} message - The success message to display
 */
export function showSuccess(message) {
  console.log('✅ Success:', message);
  showToast(message, 'success');
  hideLoading();
}

/**
 * Displays a non-blocking toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: 'info', 'success', 'warning', 'error'
 * @param {number} duration - How long to show the toast in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
  const icon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[type] || 'ℹ️';
  
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    max-width: 350px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
  `;
  
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  if (!document.getElementById('toast-styles')) {
    style.id = 'toast-styles';
    document.head.appendChild(style);
  }
  
  container.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      toast.remove();
      // Remove container if empty
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, duration);
  
  // Also log to console
  console.log(`${icon} ${message}`);
}

/**
 * Updates the wallet button display
 * @param {boolean} isConnected - Whether wallet is connected
 * @param {string} address - The wallet address (if connected)
 */
export function updateWalletButton(isConnected, address = '') {
  const btn = document.getElementById('wallet-btn');
  if (btn) {
    if (isConnected) {
      btn.textContent = `🟢 ${address.slice(0, 6)}...${address.slice(-4)}`;
      btn.classList.add('connected');
    } else {
      btn.textContent = '🔗 Connect Wallet';
      btn.classList.remove('connected');
    }
  }
}

/**
 * Shows or hides the "My Pages" button
 * @param {boolean} show - Whether to show the button
 */
export function showMyPagesButton(show) {
  const btn = document.getElementById('my-pages-btn');
  if (btn) {
    if (show) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  }
}

/**
 * Shows or hides the "My Pages" section
 * @param {boolean} show - Whether to show the section
 */
export function showMyPagesSection(show) {
  const section = document.getElementById('my-pages-section');
  if (section) {
    if (show) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  }
}
