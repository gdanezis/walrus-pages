/**
 * UI Module - Backward Compatibility Shim
 * This module re-exports functions from notifications module
 * to maintain compatibility with existing code.
 * 
 * @deprecated Import directly from notifications.js instead
 */

export { 
  showLoading, 
  hideLoading, 
  showError, 
  showSuccess,
  showToast,
  updateWalletButton,
  showMyPagesButton,
  showMyPagesSection
} from './notifications.js';
