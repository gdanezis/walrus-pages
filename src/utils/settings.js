/**
 * Settings Module - Manages user preferences for aggregator and upload relay
 */

const SETTINGS_KEY = 'walrus_settings';

// Default values
const DEFAULT_AGGREGATOR = 'https://aggregator.walrus-mainnet.walrus.space';
const DEFAULT_UPLOAD_RELAY = 'https://upload-relay.mainnet.walrus.space';
const DEFAULT_SUI_RPC = 'https://fullnode.mainnet.sui.io:443';

/**
 * Get all user settings
 * @returns {Object} Settings object with aggregator and uploadRelay
 */
export function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        aggregator: settings.aggregator || DEFAULT_AGGREGATOR,
        uploadRelay: settings.uploadRelay || DEFAULT_UPLOAD_RELAY,
        suiRpc: settings.suiRpc || DEFAULT_SUI_RPC,
      };
    }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
  }
  
  // Return defaults
  return {
    aggregator: DEFAULT_AGGREGATOR,
    uploadRelay: DEFAULT_UPLOAD_RELAY,
    suiRpc: DEFAULT_SUI_RPC,
  };
}

/**
 * Save user settings
 * @param {Object} settings - Settings to save
 * @param {string} settings.aggregator - Aggregator URL
 * @param {string} settings.uploadRelay - Upload relay URL
 * @param {string} settings.suiRpc - Sui RPC URL
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    console.log('Settings saved:', settings);
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * Reset settings to defaults
 */
export function resetSettings() {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    console.log('Settings reset to defaults');
    return true;
  } catch (error) {
    console.error('Failed to reset settings:', error);
    return false;
  }
}

/**
 * Get aggregator URL (from user settings or default)
 */
export function getAggregatorUrl() {
  const settings = getSettings();
  return settings.aggregator;
}

/**
 * Get upload relay URL (from user settings or default)
 */
export function getUploadRelayUrl() {
  const settings = getSettings();
  return settings.uploadRelay;
}

/**
 * Get Sui RPC URL (from user settings or default)
 */
export function getSuiRpcUrl() {
  const settings = getSettings();
  return settings.suiRpc;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get default values
 */
export function getDefaults() {
  return {
    aggregator: DEFAULT_AGGREGATOR,
    uploadRelay: DEFAULT_UPLOAD_RELAY,
    suiRpc: DEFAULT_SUI_RPC,
  };
}
