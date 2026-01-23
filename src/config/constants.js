/**
 * Configuration Constants
 * Centralized configuration for network endpoints, contract addresses, and system parameters
 */

// ============================================================================
// Network Configuration
// ============================================================================

/**
 * Sui mainnet RPC endpoint
 * @type {string}
 */
export const SUI_RPC_URL = 'https://fullnode.mainnet.sui.io:443';

// ============================================================================
// Walrus System Objects (Mainnet)
// ============================================================================

/**
 * Walrus package address on Sui mainnet
 * @type {string}
 */
export const WALRUS_PACKAGE = '0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77';

/**
 * Walrus system object ID
 * @type {string}
 */
export const WALRUS_SYSTEM_OBJECT = '0xf8f16d261f52720faf5518b11ae8b160b0d9a0db2bfbf60ec0eccf02e4d01e29';

/**
 * Walrus staking object (contains epoch information)
 * @type {string}
 */
export const WALRUS_STAKING_OBJECT = '0xd5d87fff8aa78cd29294411bcd8f118644f2e7bee6dc93bc48156ce00a1e1bef';

/**
 * Walrus blob type identifier
 * @type {string}
 */
export const WALRUS_BLOB_TYPE = '0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77::blob::Blob';

// ============================================================================
// Token Configuration
// ============================================================================

/**
 * WAL coin type (used for storage payments)
 * @type {string}
 */
export const WAL_COIN_TYPE = '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL';

// ============================================================================
// Storage Configuration
// ============================================================================

/**
 * Maximum storage epochs (approximately 2 years)
 * Used for default blob storage duration
 * @type {number}
 */
export const MAX_EPOCHS = 50;

/**
 * Default epochs for blob extension operations
 * @type {number}
 */
export const DEFAULT_EXTENSION_EPOCHS = 5;

// ============================================================================
// Network Settings
// ============================================================================

/**
 * Walrus network identifier
 * @type {string}
 */
export const WALRUS_NETWORK = 'mainnet';

/**
 * Walrus upload relay endpoint
 * @type {string}
 */
export const WALRUS_UPLOAD_RELAY = 'https://upload.walrus.site';

/**
 * Walrus blob read endpoint
 * @type {string}
 */
export const WALRUS_READ_ENDPOINT = 'https://blobid.walrus.site';

// ============================================================================
// Application Constants
// ============================================================================

/**
 * Default content type for uploaded pages
 * @type {string}
 */
export const DEFAULT_CONTENT_TYPE = 'text/markdown';

/**
 * Custom attribute name for page titles
 * @type {string}
 */
export const PAGE_TITLE_ATTRIBUTE = 'x-page-title';

/**
 * Custom attribute name for content type
 * @type {string}
 */
export const CONTENT_TYPE_ATTRIBUTE = 'content-type';
