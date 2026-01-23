/**
 * Settings UI Module - Handles the settings modal interface
 */

import { getSettings, saveSettings, resetSettings, isValidUrl, getDefaults } from '../utils/settings.js';
import { showToast } from '../utils/notifications.js';

let isOpen = false;

/**
 * Initialize the settings modal
 */
export function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const settingsBtn = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('close-settings-btn');
  const saveBtn = document.getElementById('save-settings-btn');
  const resetBtn = document.getElementById('reset-settings-btn');
  const aggregatorInput = document.getElementById('aggregator-input');
  const uploadRelayInput = document.getElementById('upload-relay-input');
  const suiRpcInput = document.getElementById('sui-rpc-input');
  
  // Open settings
  settingsBtn?.addEventListener('click', () => {
    openSettings();
  });
  
  // Close settings
  closeBtn?.addEventListener('click', () => {
    closeSettings();
  });
  
  // Click outside to close
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSettings();
    }
  });
  
  // Save settings
  saveBtn?.addEventListener('click', () => {
    handleSaveSettings();
  });
  
  // Reset settings
  resetBtn?.addEventListener('click', () => {
    handleResetSettings();
  });
  
  // Handle Enter key in inputs
  aggregatorInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSaveSettings();
    }
  });
  
  uploadRelayInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSaveSettings();
    }
  });
  
  suiRpcInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSaveSettings();
    }
  });
}

/**
 * Open the settings modal
 */
export function openSettings() {
  const modal = document.getElementById('settings-modal');
  const aggregatorInput = document.getElementById('aggregator-input');
  const uploadRelayInput = document.getElementById('upload-relay-input');
  const suiRpcInput = document.getElementById('sui-rpc-input');
  
  if (!modal) return;
  
  // Load current settings
  const settings = getSettings();
  aggregatorInput.value = settings.aggregator;
  uploadRelayInput.value = settings.uploadRelay;
  suiRpcInput.value = settings.suiRpc;
  
  // Update current values display
  updateCurrentSettingsDisplay();
  
  // Show modal
  modal.classList.remove('hidden');
  isOpen = true;
  
  // Focus first input
  aggregatorInput?.focus();
}

/**
 * Close the settings modal
 */
export function closeSettings() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  
  modal.classList.add('hidden');
  isOpen = false;
}

/**
 * Update the display of current settings
 */
function updateCurrentSettingsDisplay() {
  const settings = getSettings();
  const currentAggregator = document.getElementById('current-aggregator');
  const currentUploadRelay = document.getElementById('current-upload-relay');
  const currentSuiRpc = document.getElementById('current-sui-rpc');
  
  if (currentAggregator) {
    currentAggregator.textContent = settings.aggregator;
  }
  
  if (currentUploadRelay) {
    currentUploadRelay.textContent = settings.uploadRelay;
  }
  
  if (currentSuiRpc) {
    currentSuiRpc.textContent = settings.suiRpc;
  }
}

/**
 * Handle save settings button click
 */
function handleSaveSettings() {
  const aggregatorInput = document.getElementById('aggregator-input');
  const uploadRelayInput = document.getElementById('upload-relay-input');
  const suiRpcInput = document.getElementById('sui-rpc-input');
  
  const aggregator = aggregatorInput.value.trim();
  const uploadRelay = uploadRelayInput.value.trim();
  const suiRpc = suiRpcInput.value.trim();
  
  // Validate URLs
  if (aggregator && !isValidUrl(aggregator)) {
    showToast('Invalid aggregator URL. Must start with http:// or https://', 'error');
    aggregatorInput.focus();
    return;
  }
  
  if (uploadRelay && !isValidUrl(uploadRelay)) {
    showToast('Invalid upload relay URL. Must start with http:// or https://', 'error');
    uploadRelayInput.focus();
    return;
  }
  
  if (suiRpc && !isValidUrl(suiRpc)) {
    showToast('Invalid Sui RPC URL. Must start with http:// or https://', 'error');
    suiRpcInput.focus();
    return;
  }
  
  // Use defaults if empty
  const defaults = getDefaults();
  const newSettings = {
    aggregator: aggregator || defaults.aggregator,
    uploadRelay: uploadRelay || defaults.uploadRelay,
    suiRpc: suiRpc || defaults.suiRpc,
  };
  
  // Save settings
  const success = saveSettings(newSettings);
  
  if (success) {
    showToast('Settings saved successfully!', 'success');
    updateCurrentSettingsDisplay();
    
    // Close modal after a short delay
    setTimeout(() => {
      closeSettings();
    }, 1000);
  } else {
    showToast('Failed to save settings. Please try again.', 'error');
  }
}

/**
 * Handle reset settings button click
 */
function handleResetSettings() {
  const confirmed = confirm('Reset all settings to default values?');
  
  if (!confirmed) {
    return;
  }
  
  const success = resetSettings();
  
  if (success) {
    showToast('Settings reset to defaults', 'success');
    
    // Update UI
    const defaults = getDefaults();
    document.getElementById('aggregator-input').value = defaults.aggregator;
    document.getElementById('upload-relay-input').value = defaults.uploadRelay;
    document.getElementById('sui-rpc-input').value = defaults.suiRpc;
    updateCurrentSettingsDisplay();
  } else {
    showToast('Failed to reset settings', 'error');
  }
}

/**
 * Check if settings modal is open
 */
export function isSettingsOpen() {
  return isOpen;
}
