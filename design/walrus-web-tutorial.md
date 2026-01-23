# Building a Web App with Walrus Storage

A comprehensive tutorial on using Walrus to build web applications that can read, upload, and manage decentralized blob storage.

## Table of Contents

1. [Introduction](#introduction)
   - [Understanding Decentralized Storage](#understanding-decentralized-storage)
   - [What is Walrus?](#what-is-walrus)
   - [Key Web3 Concepts for Web Developers](#key-web3-concepts-for-web-developers)
2. [Prerequisites](#prerequisites)
3. [Setup and Installation](#setup-and-installation)
4. [Connecting to a Sui Wallet](#connecting-to-a-sui-wallet)
   - [Why Wallets in Web3?](#why-wallets-in-web3)
   - [The Wallet Standard](#the-wallet-standard)
   - [Sui-Specific Concepts](#sui-specific-concepts)
   - [Usage Example: Connect Button](#usage-example-connect-button)
5. [Reading Blobs from Walrus](#reading-blobs-from-walrus)
   - [Understanding Walrus Architecture](#understanding-walrus-architecture)
   - [Content Addressing in Walrus](#content-addressing-in-walrus)
   - [Reading is Free and Public](#reading-is-free-and-public)
   - [Usage Example: Loading Blob Content](#usage-example-loading-blob-content)
6. [Reading Blob Metadata](#reading-blob-metadata)
   - [Separation of Content and Metadata](#separation-of-content-and-metadata)
   - [Why Store Metadata On-Chain?](#why-store-metadata-on-chain)
   - [Understanding Epochs](#understanding-epochs)
   - [Dynamic Fields for Attributes](#dynamic-fields-for-attributes)
   - [Usage Example: Displaying Blob Information](#usage-example-displaying-blob-information)
7. [Uploading Blobs to Walrus](#uploading-blobs-to-walrus)
   - [How Uploads Work in Walrus](#how-uploads-work-in-walrus)
   - [Upload Relays](#upload-relays)
   - [Storage Economics](#storage-economics)
   - [The Signer Pattern](#the-signer-pattern)
   - [Transaction Lifecycle](#transaction-lifecycle)
   - [Usage Example: Uploading Content](#usage-example-uploading-content)
8. [Querying User Blobs](#querying-user-blobs)
   - [Blockchain-Based Ownership](#blockchain-based-ownership)
   - [Understanding Object Ownership on Sui](#understanding-object-ownership-on-sui)
   - [Filtering by Type](#filtering-by-type)
   - [Pagination is Important](#pagination-is-important)
   - [The Certified vs Uncertified Concept](#the-certified-vs-uncertified-concept)
   - [Expired vs Active Blobs](#expired-vs-active-blobs)
   - [Usage Example: Displaying User's Blobs](#usage-example-displaying-users-blobs)
9. [Deleting Blobs](#deleting-blobs)
   - [Understanding Blob Deletion in Walrus](#understanding-blob-deletion-in-walrus)
   - [Why This Design?](#why-this-design)
   - [The Burn Transaction](#the-burn-transaction)
   - [Single Blob Deletion](#single-blob-deletion)
   - [Batch Blob Deletion](#batch-blob-deletion)
   - [Usage Example: Delete Expired Blobs](#usage-example-delete-expired-blobs)
   - [Important Considerations for Deleting](#important-considerations-for-deleting)
10. [Extending Blob Storage](#extending-blob-storage)
    - [Understanding Storage Extension](#understanding-storage-extension)
    - [Extension Mechanics](#extension-mechanics)
    - [Package Upgrades and Compatibility](#package-upgrades-and-compatibility)
    - [The max_epochs_ahead Limit](#the-max_epochs_ahead-limit)
    - [Extension Economics](#extension-economics)
    - [Single Blob Extension](#single-blob-extension)
    - [Critical: Shared Object Versioning](#critical-shared-object-versioning)
    - [Batch Blob Extension](#batch-blob-extension)
    - [Usage Example: Auto-Extend Expiring Blobs](#usage-example-auto-extend-expiring-blobs)
    - [Important Considerations for Extending](#important-considerations-for-extending)
11. [Advanced Topics](#advanced-topics)
    - [Detecting the Aggregator](#detecting-the-aggregator)
    - [Robust Error Handling](#robust-error-handling)
    - [Debugging Sui Transactions](#debugging-sui-transactions)
12. [Complete Examples](#complete-examples)
    - [Example 1: Simple Content Viewer](#example-1-simple-content-viewer)
    - [Example 2: Content Upload Form](#example-2-content-upload-form)
    - [Example 3: User Dashboard](#example-3-user-dashboard)
13. [Summary](#summary)

---

## Introduction

### Understanding Decentralized Storage

Traditional web applications store data on centralized servers (AWS S3, Google Cloud Storage, etc.). If the server goes down or the company decides to delete your data, it's gone. **Decentralized storage** distributes data across a network of independent nodes, making it:

- **Censorship-resistant**: No single entity can delete your content
- **Highly available**: Data remains accessible even if some nodes go offline
- **Cryptographically verifiable**: Content is addressed by its hash, not by a URL that can change

### What is Walrus?

Walrus is a decentralized blob storage network built on the Sui blockchain. It provides:

1. **Distributed Blob Storage**: Files are split into shards, erasure-coded for redundancy, and distributed across independent storage nodes
2. **On-Chain Metadata**: Ownership, expiry times, and custom attributes are stored as objects on the Sui blockchain
3. **HTTP Aggregator Access**: Aggregator nodes reconstruct blob data from shards and serve it via standard HTTP endpoints
4. **Token-Based Economics**: Storage nodes earn WAL tokens for reliably storing data; users pay in epochs, not monthly subscriptions

### Key Web3 Concepts for Web Developers

If you're coming from traditional web development, here are the fundamental shifts:

**Content Addressing vs. Location Addressing**
- **Traditional**: `https://example.com/file.pdf` — URL points to a server location
- **Walrus**: Content identified by cryptographic hash — same content always has the same ID
- **Benefit**: No broken links, verifiable content integrity

**Cryptographic Ownership**
- **Traditional**: Database records who owns what files
- **Walrus**: Blockchain proves ownership through cryptographic signatures
- **Benefit**: No central authority can change or revoke your ownership

**Epoch-Based Storage Economics**
- **Traditional**: Monthly subscription fees, auto-renewal, unpredictable costs
- **Walrus**: Pay for specific time periods (epochs), transparent pricing, no surprise bills
- **Benefit**: Predictable costs, pay only for what you need

This tutorial teaches you how to build web applications that interact with Walrus storage for:

- **Reading blob data** from Walrus aggregators
- **Fetching metadata** about blobs from the Sui blockchain
- **Uploading new blobs** with custom attributes
- **Querying user-owned blobs** and managing storage
- **Deleting expired content** and reclaiming funds
- **Extending storage duration** for important data

## Prerequisites

Before starting this tutorial, you should have:

- **JavaScript/TypeScript Experience**: Familiarity with async/await, modules, and basic web development
- **Node.js 18+**: Required for running the development environment
- **Sui Wallet Extension**: Install [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet), [Suiet](https://suiet.app/), or [Slush](https://slushwallet.com/)
- **Test Tokens**: 
  - **SUI tokens** for gas fees (transaction costs)
  - **WAL tokens** for storage payments
  - Get testnet tokens from [Sui Faucet](https://discord.com/invite/sui) if testing

## Setup and Installation

### 1. Install Dependencies

```json
{
  "dependencies": {
    "@mysten/sui": "^1.45.2",
    "@mysten/wallet-standard": "^0.19.9",
    "@mysten/walrus": "^0.9.0"
  }
}
```

```bash
npm install @mysten/sui @mysten/wallet-standard @mysten/walrus
```

### 2. Configure Network Constants

Create a configuration file with Walrus and Sui network settings:

```javascript
// config/constants.js

/**
 * Sui mainnet RPC endpoint
 */
export const SUI_RPC_URL = 'https://fullnode.mainnet.sui.io:443';

/**
 * Walrus package address on Sui mainnet
 */
export const WALRUS_PACKAGE = '0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77';

/**
 * Walrus system object ID
 */
export const WALRUS_SYSTEM_OBJECT = '0xf8f16d261f52720faf5518b11ae8b160b0d9a0db2bfbf60ec0eccf02e4d01e29';

/**
 * Walrus blob type identifier
 */
export const WALRUS_BLOB_TYPE = '0xfdc88f7d7cf30afab2f82e8380d11ee8f70efb90e863d1de8616fae1bb09ea77::blob::Blob';

/**
 * Walrus network identifier
 */
export const WALRUS_NETWORK = 'mainnet';

/**
 * Maximum storage epochs (approximately 2 years)
 */
export const MAX_EPOCHS = 50;

/**
 * WAL coin type (for storage payments)
 */
export const WAL_COIN_TYPE = '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL';

/**
 * Attribute names for blob metadata
 */
export const PAGE_TITLE_ATTRIBUTE = 'walrus_title';
export const CONTENT_TYPE_ATTRIBUTE = 'content_type';
export const DEFAULT_CONTENT_TYPE = 'text/markdown';
```

---

## Connecting to a Sui Wallet

### Why Wallets in Web3?

In traditional web development, authentication happens via username/password or OAuth. In Web3:

- **Wallets are your identity**: Your wallet address is your public identifier
- **Private keys prove ownership**: Only you can sign transactions with your private key
- **No backend authentication**: The blockchain verifies signatures, not your server
- **Users control their data**: Wallets never share private keys with websites

### The Wallet Standard

The **Wallet Standard** is a protocol that allows websites to communicate with different wallet extensions (Sui Wallet, Suiet, Slush, etc.) through a unified interface. This is similar to how OAuth works, but decentralized:

1. Website requests connection
2. Wallet extension prompts user for approval
3. User approves, wallet shares public address (not private keys)
4. Website can now request signed transactions

### Sui-Specific Concepts

- **Accounts**: Each wallet can have multiple accounts (addresses)
- **Chains**: Wallets support multiple networks (mainnet, testnet, devnet)
- **Transaction Signing**: Wallets sign transaction bytes, then websites submit to blockchain

Walrus transactions require a connected Sui wallet. Here's how to implement wallet connection using the Wallet Standard:

```javascript
// utils/wallet.js

import { getWallets } from '@mysten/wallet-standard';

let currentWallet = null;
let currentAccount = null;

export async function connectWallet() {
  try {
    // Get available wallets using Wallet Standard
    const wallets = getWallets();
    
    if (!wallets || wallets.get().length === 0) {
      throw new Error('No Sui wallet detected. Please install a Sui wallet extension.');
    }
    
    // Filter for Sui-compatible wallets
    const allWallets = wallets.get();
    const suiWallets = allWallets.filter(wallet => {
      return wallet.chains && wallet.chains.some(chain => 
        chain.startsWith('sui:')
      );
    });
    
    if (suiWallets.length === 0) {
      throw new Error('No Sui wallet detected.');
    }
    
    // Use first available Sui wallet
    const wallet = suiWallets[0];
    currentWallet = wallet;
    
    console.log('Connecting to wallet:', wallet.name);
    
    // Request account access
    const accounts = await wallet.features['standard:connect'].connect();
    
    if (!accounts || accounts.accounts.length === 0) {
      throw new Error('No accounts found in wallet');
    }
    
    currentAccount = accounts.accounts[0];
    
    // Save connection state
    localStorage.setItem('walrus_wallet_address', currentAccount.address);
    
    console.log('Wallet connected:', currentAccount.address);
    
    return {
      wallet: currentWallet,
      account: currentAccount,
      address: currentAccount.address,
    };
    
  } catch (error) {
    console.error('Wallet connection failed:', error);
    throw error;
  }
}

export function getWallet() {
  return currentWallet;
}

export function getAccount() {
  return currentAccount;
}

export function disconnect() {
  currentWallet = null;
  currentAccount = null;
  localStorage.removeItem('walrus_wallet_address');
}
```

### Usage Example: Connect Button

Here's how to integrate wallet connection into your application:

```javascript
import { connectWallet, getAccount } from './utils/wallet.js';

// Add this to your connect button handler
async function handleConnectButton() {
  try {
    const { address } = await connectWallet();
    console.log('Connected to wallet:', address);
    
    // Update UI to show connected state
    document.getElementById('wallet-btn').textContent = 
      `${address.slice(0, 6)}...${address.slice(-4)}`;
    
  } catch (error) {
    console.error('Wallet connection failed:', error);
    alert('Please install a Sui wallet extension (Sui Wallet, Suiet, or Slush)');
  }
}
```

---

## Reading Blobs from Walrus

### Understanding Walrus Architecture

Walrus separates **storage** from **retrieval**:

**Storage Nodes**: Hold encoded blob data (you never interact with these directly)
- Data is erasure-coded for redundancy
- Nodes are incentivized to store data reliably
- If some nodes go offline, data remains recoverable

**Aggregator Nodes**: Reconstruct and serve blob data via HTTP
- Query storage nodes for blob shards
- Decode and reconstruct the original data
- Serve it via simple REST APIs
- Anyone can run an aggregator

### Content Addressing in Walrus

Blobs can be identified two ways:

1. **Blob ID** (base64): Hash of the content itself
   - `aB3cD4eF5gH...` - Always refers to the same content
   - Content-addressed: Same content = same ID
   
2. **Object ID** (0x...): Sui blockchain object address
   - `0xabc123...` - Points to the metadata object
   - Includes ownership, expiry, custom attributes
   - More powerful for applications

### Why This Matters

Unlike traditional web where URLs can break ("404 Not Found"), content-addressed systems ensure:
- **Verifiability**: You can verify the content matches its hash
- **Permanence**: As long as someone stores it, it's accessible
- **No link rot**: Content ID never changes

### Reading is Free and Public

Important: **You don't need a wallet or permission to read blobs**. This is different from traditional cloud storage where access control requires authentication. In Walrus:
- Anyone can read any blob via aggregators
- Privacy comes from encryption, not access control
- Perfect for public content (websites, images, documents)

Walrus blobs are served through aggregator nodes. You can fetch blob content using HTTP requests:

```javascript
// utils/walrus.js

/**
 * Detect the Walrus aggregator URL from the page origin or use default
 */
export function detectAggregator() {
  // If the app is served from a Walrus aggregator, use that
  const origin = window.location.origin;
  
  // Check if we're on a Walrus aggregator (typically has walrus in domain)
  if (origin.includes('walrus')) {
    return origin;
  }
  
  // Default to mainnet aggregator
  return 'https://aggregator.mainnet.walrus.space';
}

/**
 * Fetch blob content from Walrus aggregator
 * @param {string} idOrObjectId - Either a blob ID (base64) or object ID (0x...)
 * @returns {Promise<string>} Blob content as text
 */
export async function fetchBlob(idOrObjectId) {
  const aggregator = detectAggregator();
  
  // Determine if this is an object ID (starts with 0x) or blob ID (base64)
  const isObjectId = idOrObjectId.startsWith('0x');
  
  let url;
  if (isObjectId) {
    // For object IDs, use the by-object-id endpoint
    url = `${aggregator}/v1/blobs/by-object-id/${idOrObjectId}`;
  } else {
    // For blob IDs, use the direct endpoint
    url = `${aggregator}/v1/${idOrObjectId}`;
  }
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Error fetching blob:', error);
    throw error;
  }
}
```

### Usage Example: Loading Blob Content

```javascript
import { fetchBlob } from './utils/walrus.js';

async function loadBlobContent(objectId) {
  try {
    const content = await fetchBlob(objectId);
    console.log('Blob content:', content);
    
    // Display in your UI
    document.getElementById('content').textContent = content;
  } catch (error) {
    console.error('Failed to load blob:', error);
  }
}

// Example usage
loadBlobContent('0xabc123...');
```

---

## Reading Blob Metadata

### Separation of Content and Metadata

This is a key Walrus design principle that differs from traditional storage:

**Content** (the actual blob data)
- Stored in Walrus storage network
- Accessed via aggregators
- Immutable and content-addressed

**Metadata** (info about the blob)
- Stored on Sui blockchain
- Accessed via Sui RPC
- Includes ownership, expiry, size, custom attributes

### Why Store Metadata On-Chain?

The Sui blockchain provides:

1. **Ownership Records**: Cryptographic proof of who owns each blob
2. **Expiry Tracking**: When storage epochs end (automated by smart contracts)
3. **Custom Attributes**: Key-value pairs stored as dynamic fields
4. **Programmability**: Smart contracts can interact with blob objects

### Understanding Epochs

**Epochs** are time periods in Walrus (approximately 2 weeks each):
- Storage is paid for in epochs, not bytes-per-month
- Each blob has an `expiryEpoch` number
- When current epoch > expiry epoch, blob can be deleted
- More predictable than traditional "pay-per-GB-per-month" billing

### Dynamic Fields for Attributes

Sui's **dynamic fields** allow attaching arbitrary key-value data to objects:
- Traditional: Store metadata in a separate database
- Sui: Metadata lives with the object on-chain
- Benefits: Cannot be separated from the object, cryptographically linked

Common attributes:
- `content_type`: MIME type (text/html, image/png, etc.)
- `walrus_title`: Human-readable name
- Custom: Any key-value pairs you need

Blob metadata (expiry epoch, storage size, attributes) is stored on the Sui blockchain:

```javascript
// services/blob-metadata.js

import { SuiClient } from '@mysten/sui/client';
import { SUI_RPC_URL } from '../config/constants.js';

/**
 * Get blob metadata including expiry and storage information
 * @param {string} objectId - Blob object ID on Sui blockchain
 * @returns {Promise<Object>} Blob metadata object
 */
export async function getBlobMetadata(objectId) {
  try {
    const client = new SuiClient({ url: SUI_RPC_URL });
    
    // Get object details
    const object = await client.getObject({
      id: objectId,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      }
    });
    
    if (!object || !object.data) {
      throw new Error('Blob object not found');
    }
    
    // Extract blob metadata from object content
    const content = object.data.content;
    let expiryEpoch = null;
    let blobId = null;
    let storageSize = null;
    
    if (content && content.dataType === 'moveObject' && content.fields) {
      const fields = content.fields;
      
      // Extract Walrus blob fields
      if (fields.storage && fields.storage.fields) {
        expiryEpoch = fields.storage.fields.end_epoch || fields.storage.fields.endEpoch;
        storageSize = fields.storage.fields.storage_size || fields.storage.fields.storageSize;
      }
      
      blobId = fields.blob_id || fields.blobId || fields.id;
    }
    
    return {
      objectId,
      expiryEpoch,
      blobId,
      storageSize,
      owner: object.data.owner,
    };
    
  } catch (error) {
    console.error('Error getting blob metadata:', error);
    return {
      objectId,
      expiryEpoch: null,
      blobId: null,
      error: error.message,
    };
  }
}

/**
 * Get a custom attribute from blob metadata
 * @param {string} objectId - Blob object ID
 * @param {string} attributeName - Name of attribute to retrieve
 * @returns {Promise<string|null>} Attribute value or null
 */
export async function getBlobAttribute(objectId, attributeName) {
  try {
    const client = new SuiClient({ url: SUI_RPC_URL });
    
    // Get dynamic fields (where attributes are stored)
    const dynamicFields = await client.getDynamicFields({
      parentId: objectId,
    });
    
    if (!dynamicFields || !dynamicFields.data) {
      return null;
    }
    
    // Look for the "metadata" field
    for (const field of dynamicFields.data) {
      let fieldName = field.name?.value;
      if (Array.isArray(fieldName)) {
        fieldName = String.fromCharCode(...fieldName);
      } else {
        fieldName = field.name?.value || field.name;
      }
      
      if (fieldName === 'metadata') {
        // Get the metadata object
        const metadataObject = await client.getDynamicFieldObject({
          parentId: objectId,
          name: field.name,
        });
        
        // Look for attributes in the metadata
        const metadataFields = metadataObject?.data?.content?.fields?.value?.fields;
        
        if (metadataFields && metadataFields.metadata) {
          const contents = metadataFields.metadata.fields?.contents;
          
          if (Array.isArray(contents)) {
            for (const entry of contents) {
              const key = entry.fields?.key || entry.key;
              const value = entry.fields?.value || entry.value;
              
              if (key === attributeName) {
                return value;
              }
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${attributeName}:`, error);
    return null;
  }
}

/**
 * Get page title attribute from blob metadata
 */
export async function getPageTitle(objectId) {
  return getBlobAttribute(objectId, 'walrus_title');
}

/**
 * Get content-type attribute from blob metadata
 */
export async function getContentType(objectId) {
  return getBlobAttribute(objectId, 'content_type');
}
```

### Usage Example: Displaying Blob Information

```javascript
import { getBlobMetadata, getPageTitle, getContentType } from './services/blob-metadata.js';

async function displayBlobInfo(objectId) {
  // Get basic metadata
  const metadata = await getBlobMetadata(objectId);
  console.log('Expiry Epoch:', metadata.expiryEpoch);
  console.log('Blob ID:', metadata.blobId);
  console.log('Storage Size:', metadata.storageSize);
  
  // Get custom attributes
  const title = await getPageTitle(objectId);
  const contentType = await getContentType(objectId);
  
  console.log('Title:', title);
  console.log('Content Type:', contentType);
}
```

---

## Uploading Blobs to Walrus

### How Uploads Work in Walrus

Uploading to Walrus involves two steps:

1. **Send data to upload relay**: HTTP POST with your content
2. **Submit transaction on Sui**: Creates blob object, pays for storage

This differs from traditional cloud uploads:
- **Traditional**: Upload to S3, get a URL, done
- **Walrus**: Upload content + blockchain transaction for ownership

### Upload Relays

Upload relays are services that:
- Accept blob data via HTTP
- Encode and distribute it to storage nodes
- Return a blob ID
- Charge a small tip (paid in SUI)

Anyone can run an upload relay, making the system decentralized.

### Storage Economics

**Paying for Storage**:
- Cost is based on size × epochs (time periods)
- Example: 1 MB for 50 epochs ≈ 2 years (100 weeks)
- Payment uses WAL tokens (Walrus native token)
- Price is transparent and predictable

**Deletable vs. Non-Deletable Blobs**:
- **Deletable**: You can burn the object before expiry (reclaim some funds)
- **Non-Deletable**: Permanent until expiry, cannot be removed early
- Non-deletable is cheaper (no deletion option = simpler)

### The Signer Pattern

Why do we need a "signer wrapper"?

**The Problem**: 
- Wallet Standard API: Browser extensions signing format
- Sui SDK API: Expects a specific `Signer` interface
- They don't match directly

**The Solution**:
- Create a wrapper that implements Sui SDK's `Signer` interface
- Internally calls Wallet Standard methods
- Bridges the two APIs seamlessly

This pattern is common in Web3 development where different APIs need to interoperate.

### Transaction Lifecycle

1. Build transaction (JavaScript)
2. Serialize to bytes
3. Send to wallet for signing
4. Wallet prompts user approval
5. User approves → wallet signs with private key
6. Submit signed transaction to blockchain
7. Blockchain validates signature and executes
8. Get transaction result with created objects

Uploading requires creating a signer wrapper and using the WalrusClient SDK:

```javascript
// services/walrus-upload.js

import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { getWallet, getAccount } from '../utils/wallet.js';
import { 
  SUI_RPC_URL,
  MAX_EPOCHS, 
  DEFAULT_CONTENT_TYPE,
  PAGE_TITLE_ATTRIBUTE,
  CONTENT_TYPE_ATTRIBUTE,
  WALRUS_NETWORK,
} from '../config/constants.js';

/**
 * Creates a signer wrapper that implements the Sui SDK Signer interface
 * This bridges between Wallet Standard and the Sui SDK
 */
function createSigner(wallet, account) {
  return {
    toSuiAddress() {
      return account.address;
    },
    getPublicKey() {
      return account.publicKey;
    },
    async signAndExecuteTransaction({ transaction, client }) {
      // Set sender if not already set
      transaction.setSenderIfNotSet(account.address);
      
      // Build the transaction to get bytes
      const bytes = await transaction.build({ client });
      
      // Sign the transaction bytes using the wallet
      const { signature } = await wallet.features['sui:signTransaction'].signTransaction({
        transaction: {
          toJSON: async () => {
            return await transaction.toJSON({ client, supportedIntents: [] });
          }
        },
        account,
        chain: 'sui:mainnet',
      });
      
      // Execute the signed transaction
      const result = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });
      
      // Transform effects.created and effects.mutated to changedObjects format
      if (result.effects && !result.effects.changedObjects && 
          (result.effects.created || result.effects.mutated)) {
        result.effects.changedObjects = [];
        
        if (result.effects.created) {
          result.effects.created.forEach(obj => {
            result.effects.changedObjects.push({
              id: obj.reference.objectId,
              idOperation: 'Created',
              ...obj
            });
          });
        }
        
        if (result.effects.mutated) {
          result.effects.mutated.forEach(obj => {
            result.effects.changedObjects.push({
              id: obj.reference.objectId,
              idOperation: 'Mutated',
              ...obj
            });
          });
        }
      }
      
      return {
        digest: result.digest,
        effects: result.effects,
      };
    },
  };
}

/**
 * Upload content to Walrus storage
 * @param {string} content - The content to upload
 * @param {Object} options - Upload options
 * @param {string} options.title - Optional page title
 * @param {string} options.contentType - Content type (defaults to text/markdown)
 * @param {number} options.epochs - Storage duration in epochs
 * @param {boolean} options.deletable - Whether blob can be deleted
 * @returns {Promise<{objectId: string, blobId: string, expiryEpoch: number}>}
 */
export async function uploadToWalrus(content, options = {}) {
  console.log('🚀 Uploading to Walrus with options:', options);
  
  const { 
    title, 
    contentType = DEFAULT_CONTENT_TYPE,
    epochs = MAX_EPOCHS,
    deletable = false 
  } = options;
  
  const wallet = getWallet();
  const account = getAccount();
  
  if (!wallet || !account) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Convert content to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    
    // Create SuiClient
    const suiClient = new SuiClient({ url: SUI_RPC_URL });
    
    // Create Walrus client with upload relay
    const walrusClient = new WalrusClient({
      network: WALRUS_NETWORK,
      suiRpcUrl: SUI_RPC_URL,
      uploadRelay: {
        host: 'https://upload-relay.mainnet.walrus.space',
        sendTip: {
          max: 10_000_000,  // 0.01 SUI max tip
        },
      },
    });
    
    // Create signer wrapper
    const signer = createSigner(wallet, account);
    
    // Build attributes object
    const attributes = {
      [CONTENT_TYPE_ATTRIBUTE]: contentType,
    };
    
    if (title) {
      attributes[PAGE_TITLE_ATTRIBUTE] = title;
    }
    
    console.log('📦 Upload attributes:', attributes);
    
    // Upload blob to Walrus
    const result = await walrusClient.writeBlob({
      blob: data,
      deletable,
      epochs,
      signer,
      attributes,
    });
    
    console.log('Walrus writeBlob result:', result);
    
    // Extract the blob object from transaction effects
    const blobObject = result.blobObject || result.newlyCreatedBlobs?.[0]?.blobObject;
    
    if (!blobObject) {
      throw new Error('Failed to get blob object from upload result');
    }
    
    const objectId = blobObject.id?.id || blobObject.id;
    
    console.log('✅ Blob uploaded successfully!');
    console.log('   Object ID:', objectId);
    console.log('   Blob ID:', result.blobId);
    
    return {
      objectId: objectId,
      blobId: result.blobId || blobObject.blobId,
      expiryEpoch: blobObject.storage?.end_epoch || blobObject.endEpoch,
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

### Usage Example: Uploading Content

```javascript
import { uploadToWalrus } from './services/walrus-upload.js';
import { connectWallet } from './utils/wallet.js';

async function uploadContent() {
  // Make sure wallet is connected
  await connectWallet();
  
  const content = '# Hello Walrus\n\nThis is my first decentralized page!';
  
  try {
    const result = await uploadToWalrus(content, {
      title: 'My First Page',
      contentType: 'text/markdown',
      epochs: 50,  // ~2 years (50 epochs × 2 weeks each)
      deletable: false
    });
    
    console.log('Upload successful!');
    console.log('Object ID:', result.objectId);
    console.log('Blob ID:', result.blobId);
    console.log('Expires at epoch:', result.expiryEpoch);
    
    // Save objectId to view the content later
    localStorage.setItem('myBlobObjectId', result.objectId);
    
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed: ' + error.message);
  }
}
```

---

## Querying User Blobs

### Blockchain-Based Ownership

In traditional web apps:
- Database stores: `user_id → list of file_ids`
- You query your backend: "Give me files for user X"
- Backend checks permissions, returns data

**In Sui/Walrus**:
- Blockchain stores: `address → owned objects`
- Query the blockchain directly: "What objects does address X own?"
- No backend needed, no permission checks to hack
- Ownership is cryptographic, not just a database entry

### Understanding Object Ownership on Sui

Sui has several ownership models:

1. **Address-Owned**: Object belongs to a specific address (most blob objects)
2. **Shared Objects**: Multiple addresses can interact (not typical for blobs)
3. **Immutable**: Cannot be modified, no owner (rare for blobs)

When you upload a blob, the created object is **address-owned by your wallet**.

### Filtering by Type

Sui stores many types of objects (NFTs, coins, blobs, etc.). We filter by:
```
WALRUS_BLOB_TYPE = "0xfdc88...::blob::Blob"
```

This is the Move type identifier for Walrus blob objects. Only objects matching this type are returned.

### Pagination is Important

Unlike traditional databases where you might `LIMIT 1000`, blockchain queries paginate differently:
- Each page has a `cursor` pointing to the next page
- Must iterate: Fetch page → check `hasNextPage` → use `nextCursor`
- This ensures consistent results even as state changes

### The Certified vs Uncertified Concept

Walrus has a **certification** process:
- **Uncertified**: Uploaded but not yet verified by storage nodes
- **Certified**: Confirmed stored and retrievable across the network
- Certification happens asynchronously (usually within minutes)
- Uncertified blobs can still be read, but aren't fully guaranteed yet

### Expired vs Active Blobs

Blobs have lifecycle states:
- **Active**: `currentEpoch < expiryEpoch` - Guaranteed to be stored
- **Expired**: `currentEpoch >= expiryEpoch` - May be garbage collected
- Expired blobs can often still be retrieved (grace period)
- Eventually, storage nodes reclaim space from expired blobs

Query all blobs owned by a wallet address:

```javascript
// services/blob-query.js

import { SuiClient } from '@mysten/sui/client';
import { WalrusClient } from '@mysten/walrus';
import { SUI_RPC_URL, WALRUS_BLOB_TYPE, WALRUS_NETWORK } from '../config/constants.js';
import { getBlobMetadata, getPageTitle, getContentType } from './blob-metadata.js';

/**
 * Get current Walrus epoch from system state
 */
export async function getCurrentEpoch() {
  try {
    const walrusClient = new WalrusClient({
      network: WALRUS_NETWORK,
      suiRpcUrl: SUI_RPC_URL,
    });
    
    const systemState = await walrusClient.systemState();
    const currentEpoch = systemState?.committee?.epoch || 0;
    return currentEpoch;
  } catch (error) {
    console.warn('Could not fetch current epoch:', error);
    return 0;
  }
}

/**
 * Get user's blob objects
 * @param {string} address - User's wallet address
 * @param {Object} options - Options for filtering
 * @param {boolean} options.includeExpired - Include expired blobs
 * @returns {Promise<Array>} Array of blob objects with metadata
 */
export async function getUserBlobs(address, options = {}) {
  const { includeExpired = false } = options;
  
  try {
    const client = new SuiClient({ url: SUI_RPC_URL });
    const currentEpoch = await getCurrentEpoch();
    
    console.log('🔍 Querying blobs for address:', address);
    
    let allObjects = [];
    let cursor = null;
    let hasNextPage = true;
    
    // Query with pagination
    while (hasNextPage) {
      const result = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: WALRUS_BLOB_TYPE,
        },
        options: {
          showContent: true,
          showType: true,
        },
        limit: 50,
        cursor: cursor,
      });
      
      if (result.data) {
        allObjects = allObjects.concat(result.data);
      }
      
      hasNextPage = result.hasNextPage;
      cursor = result.nextCursor;
    }
    
    console.log('Total objects found:', allObjects.length);
    
    const blobs = [];
    
    // Process each blob
    for (const item of allObjects) {
      const object = item.data;
      if (!object) continue;
      
      // Get metadata
      const metadata = await getBlobMetadata(object.objectId);
      
      // Filter expired blobs if requested
      if (!includeExpired && metadata.expiryEpoch && metadata.expiryEpoch < currentEpoch) {
        continue;
      }
      
      // Get custom attributes
      const title = await getPageTitle(object.objectId);
      const contentType = await getContentType(object.objectId);
      
      blobs.push({
        objectId: object.objectId,
        blobId: metadata.blobId,
        expiryEpoch: metadata.expiryEpoch,
        storageSize: metadata.storageSize,
        title: title || 'Untitled',
        contentType: contentType || 'application/octet-stream',
        isExpired: metadata.expiryEpoch && metadata.expiryEpoch < currentEpoch,
      });
    }
    
    return blobs;
    
  } catch (error) {
    console.error('Error querying user blobs:', error);
    throw error;
  }
}
```

### Usage Example: Displaying User's Blobs

```javascript
import { getUserBlobs } from './services/blob-query.js';
import { getAccount } from './utils/wallet.js';

async function displayMyPages() {
  const account = getAccount();
  
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }
  
  try {
    const blobs = await getUserBlobs(account.address, {
      includeExpired: false  // Only active blobs
    });
    
    console.log('Found', blobs.length, 'blobs');
    
    // Display in UI
    blobs.forEach(blob => {
      console.log('---');
      console.log('Title:', blob.title);
      console.log('Object ID:', blob.objectId);
      console.log('Content Type:', blob.contentType);
      console.log('Expiry Epoch:', blob.expiryEpoch);
      console.log('Size:', blob.storageSize, 'bytes');
    });
    
  } catch (error) {
    console.error('Failed to load blobs:', error);
  }
}
```

---

## Deleting Blobs

### Understanding Blob Deletion in Walrus

Unlike traditional cloud storage where you can delete files at any time, Walrus has specific rules about blob deletion:

**Deletable Blobs**:
- Marked as `deletable: true` during upload
- Can be destroyed (burned) by the owner at any time
- Burning returns remaining storage funds to the owner
- Transaction calls `blob::burn` Move function

**Non-Deletable Blobs**:
- Marked as `deletable: false` during upload
- Cannot be deleted until after expiry epoch
- Guaranteed to exist for the paid duration
- Cheaper to store (no deletion logic needed)

### Why This Design?

This deletion model provides:

1. **Predictability**: Non-deletable blobs are guaranteed to exist
2. **Cost Efficiency**: Deletable blobs cost more (extra functionality)
3. **Economic Recovery**: Get refunds for unused storage epochs
4. **Immutability Option**: Choose between mutable (deletable) or immutable storage

### The Burn Transaction

When you delete a blob, you're calling the `blob::burn` function which:
1. Verifies you own the blob object
2. Verifies the blob is deletable
3. Calculates remaining storage value
4. Returns funds to your address
5. Destroys the blob object on-chain

Storage nodes will then remove the blob data during garbage collection.

### Single Blob Deletion

For deleting individual blobs:

```javascript
// services/blob-operations.js

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { getWallet, getAccount } from '../utils/wallet.js';
import { SUI_RPC_URL, WALRUS_PACKAGE } from '../config/constants.js';

/**
 * Helper to sign and execute a transaction
 */
async function signAndExecuteTransaction(tx) {
  const wallet = getWallet();
  const account = getAccount();
  const client = new SuiClient({ url: SUI_RPC_URL });
  
  // Set sender
  tx.setSenderIfNotSet(account.address);
  
  // Build transaction
  const bytes = await tx.build({ client });
  
  // Sign with wallet
  const { signature } = await wallet.features['sui:signTransaction'].signTransaction({
    transaction: {
      toJSON: async () => {
        return await tx.toJSON({ client, supportedIntents: [] });
      }
    },
    account,
    chain: 'sui:mainnet',
  });
  
  // Execute
  const result = await client.executeTransactionBlock({
    transactionBlock: bytes,
    signature,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });
  
  return result;
}

/**
 * Delete (burn) a single blob
 * @param {string} objectId - Blob object ID to delete
 * @returns {Promise<Object>} Transaction result
 */
export async function deleteBlob(objectId) {
  const wallet = getWallet();
  const account = getAccount();
  
  if (!wallet || !account) {
    throw new Error('Wallet not connected');
  }
  
  console.log('Deleting blob:', objectId);
  
  try {
    const tx = new Transaction();
    
    // Set gas budget
    tx.setGasBudget(100_000_000); // 0.1 SUI
    
    // Call blob::burn to destroy the blob
    tx.moveCall({
      target: `${WALRUS_PACKAGE}::blob::burn`,
      arguments: [
        tx.object(objectId),
      ],
    });
    
    // Execute transaction
    console.log('Executing delete transaction...');
    const result = await signAndExecuteTransaction(tx);
    
    console.log('✅ Blob deleted successfully');
    return result;
    
  } catch (error) {
    console.error('Error deleting blob:', error);
    throw error;
  }
}
```

### Batch Blob Deletion

For deleting multiple blobs in one transaction (more efficient):

```javascript
/**
 * Delete multiple blobs in a single transaction
 * @param {Array} blobObjects - Array of blob objects with objectId
 * @returns {Promise<Object>} Transaction result
 */
export async function deleteBlobsBatch(blobObjects) {
  const wallet = getWallet();
  const account = getAccount();
  
  if (!wallet || !account) {
    throw new Error('Wallet not connected');
  }
  
  if (!blobObjects || blobObjects.length === 0) {
    throw new Error('No blobs to delete');
  }
  
  console.log(`Deleting ${blobObjects.length} blob(s)`);
  
  try {
    const tx = new Transaction();
    
    // Set gas budget based on number of blobs
    tx.setGasBudget(100_000_000 + (blobObjects.length * 10_000_000));
    
    // Add burn operation for each blob
    for (const blob of blobObjects) {
      console.log('Adding burn for blob:', blob.objectId);
      
      tx.moveCall({
        target: `${WALRUS_PACKAGE}::blob::burn`,
        arguments: [
          tx.object(blob.objectId),
        ],
      });
    }
    
    // Execute transaction
    console.log('Executing batch delete transaction...');
    const result = await signAndExecuteTransaction(tx);
    
    console.log(`✅ ${blobObjects.length} blobs deleted successfully`);
    return result;
    
  } catch (error) {
    console.error('Error in batch delete:', error);
    throw error;
  }
}
```

### Usage Example: Delete Expired Blobs

A common pattern is to clean up expired blobs to reclaim storage funds:

```javascript
import { getUserBlobs, getCurrentEpoch } from './services/blob-query.js';
import { deleteBlobsBatch } from './services/blob-operations.js';
import { getAccount } from './utils/wallet.js';

async function cleanupExpiredBlobs() {
  const account = getAccount();
  
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }
  
  try {
    // Get current epoch
    const currentEpoch = await getCurrentEpoch();
    console.log('Current epoch:', currentEpoch);
    
    // Get all user blobs (including expired)
    const allBlobs = await getUserBlobs(account.address, {
      includeExpired: true
    });
    
    // Filter for expired AND deletable blobs
    const expiredDeletable = allBlobs.filter(blob => 
      blob.expiryEpoch < currentEpoch && blob.deletable
    );
    
    if (expiredDeletable.length === 0) {
      console.log('No expired deletable blobs found');
      return;
    }
    
    console.log(`Found ${expiredDeletable.length} expired deletable blobs`);
    
    // Confirm with user
    const confirmed = confirm(
      `Delete ${expiredDeletable.length} expired blobs and reclaim storage funds?`
    );
    
    if (!confirmed) {
      return;
    }
    
    // Delete in batches of 10 (to avoid transaction size limits)
    const batchSize = 10;
    for (let i = 0; i < expiredDeletable.length; i += batchSize) {
      const batch = expiredDeletable.slice(i, i + batchSize);
      console.log(`Deleting batch ${Math.floor(i / batchSize) + 1}...`);
      
      await deleteBlobsBatch(batch);
      
      console.log(`✅ Deleted ${batch.length} blobs`);
    }
    
    alert('All expired blobs deleted successfully!');
    
  } catch (error) {
    console.error('Failed to cleanup expired blobs:', error);
    alert('Deletion failed: ' + error.message);
  }
}
```

### Important Considerations for Deleting

**Gas Costs**:
- Each blob burn costs gas (SUI)
- Batching is cheaper than individual transactions
- Limit batches to ~10-20 blobs per transaction

**Refunds**:
- Burned blobs return unused storage epochs as WAL tokens
- Refund amount = (remaining epochs) × (storage cost per epoch)
- Refunds go to the blob owner's address

**Irreversibility**:
- Burning is permanent - content cannot be recovered
- Storage nodes will garbage collect the data
- Always confirm before deleting

**Error Handling**:
- Transaction fails if any blob is non-deletable
- Transaction fails if you don't own the blob
- Check blob properties before attempting deletion

---

## Extending Blob Storage

### Understanding Storage Extension

In traditional cloud storage, you keep paying monthly until you cancel. In Walrus, storage has a defined end epoch. **Extension** adds more epochs to keep your blob alive longer.

### Extension Mechanics

**How it works**:
1. Blob currently expires at epoch 100
2. Current epoch is 80 (20 epochs remaining)
3. You extend by 30 epochs
4. New expiry: epoch 130
5. Cost: 30 epochs × storage size

### Package Upgrades and Compatibility

**Critical Concept**: When Walrus packages are upgraded on Sui, existing blobs retain their original package ID in their type, but you must call functions from the new package.

**Example**:
- Blob object type: `0xfdc88f7d...::blob::Blob` (created with old package)
- System object package_id: `0xfa65cb2d...` (current active package)
- Function to call: `0xfa65cb2d...::system::extend_blob` (new package)

**Why This Works**:
Sui's upgrade system maintains layout compatibility - structs and function signatures remain the same. The Move runtime automatically handles type compatibility between old and new package versions.

**Best Practice**: Always fetch the current package ID dynamically from the system object:

```javascript
const systemObject = await walrusClient.systemObject();
const walrusPackageId = systemObject.package_id; // Current active package

tx.moveCall({
  target: `${walrusPackageId}::system::extend_blob`,
  arguments: [...]
});
```

❌ **Don't**: Use hardcoded package addresses that become outdated
✅ **Do**: Read package_id from system object at runtime

### The max_epochs_ahead Limit

Walrus has a constraint: **max_epochs_ahead** (typically 52 epochs)

This means:
- You can't extend too far into the future
- `new_expiry_epoch - current_epoch ≤ 52`
- Prevents resource lock-up for excessive durations

**Example**:
- Current epoch: 100
- Blob expires at: 145
- Offset: 145 - 100 = 45 epochs ahead
- Max additional extension: 52 - 45 = 7 epochs
- Can extend by up to 7 more epochs

### Extension Economics

**Payment**:
- Extensions cost WAL tokens (Walrus native currency)
- Cost = storage_size × epochs × price_per_epoch
- Price determined by network supply/demand

**When to Extend**:
- Before blob expires (obviously)
- When blob is still useful/needed
- When you have sufficient WAL balance
- Batch multiple extensions to save gas

### Single Blob Extension

For extending one blob at a time:

```javascript
// services/blob-operations.js

import { WalrusClient } from '@mysten/walrus';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { 
  SUI_RPC_URL, 
  WALRUS_PACKAGE, 
  WALRUS_NETWORK,
  WAL_COIN_TYPE 
} from '../config/constants.js';

/**
 * Extend a single blob's storage duration
 * @param {string} objectId - Blob object ID
 * @param {number} additionalEpochs - Number of epochs to extend
 * @returns {Promise<Object>} Transaction result
 */
export async function extendBlob(objectId, additionalEpochs) {
  const wallet = getWallet();
  const account = getAccount();
  
  if (!wallet || !account) {
    throw new Error('Wallet not connected');
  }
  
  console.log(`Extending blob ${objectId} by ${additionalEpochs} epochs`);
  
  try {
    const client = new SuiClient({ url: SUI_RPC_URL });
    const walrusClient = new WalrusClient({
      network: WALRUS_NETWORK,
      suiRpcUrl: SUI_RPC_URL,
    });
    
    // Get current epoch and max_epochs_ahead
    const systemState = await walrusClient.systemState();
    const currentEpoch = systemState.committee.epoch;
    const maxEpochsAhead = 52; // Typical value
    
    // Get blob metadata to check current expiry
    const blobObj = await client.getObject({
      id: objectId,
      options: { showContent: true }
    });
    
    const fields = blobObj.data.content.fields;
    const currentExpiry = fields.storage.fields.end_epoch;
    
    // Calculate safe extension
    const currentOffset = currentExpiry - currentEpoch;
    const maxSafeExtension = maxEpochsAhead - currentOffset;
    const safeEpochs = Math.min(additionalEpochs, maxSafeExtension);
    
    if (safeEpochs <= 0) {
      throw new Error(
        `Blob already at max extension limit (expires at epoch ${currentExpiry}, ` +
        `offset: ${currentOffset}/${maxEpochsAhead})`
      );
    }
    
    console.log(`Extending by ${safeEpochs} epochs (requested: ${additionalEpochs})`);
    
    // Create transaction
    const tx = new Transaction();
    tx.setGasBudget(500_000_000); // 0.5 SUI
    
    // Get system object
    const systemObject = await walrusClient.systemObject();
    const systemObjRef = tx.sharedObjectRef({
      objectId: systemObject.id.id,
      initialSharedVersion: systemObject.version,
      mutable: true,
    });
    
    // Get WAL coins for payment
    const walCoins = await client.getCoins({
      owner: account.address,
      coinType: WAL_COIN_TYPE,
    });
    
    if (!walCoins.data || walCoins.data.length === 0) {
      throw new Error('No WAL coins found in wallet');
    }
    
    // Merge WAL coins
    const [primaryCoin, ...otherCoins] = walCoins.data.map(c => c.coinObjectId);
    let walCoinRef = tx.object(primaryCoin);
    
    if (otherCoins.length > 0) {
      tx.mergeCoins(walCoinRef, otherCoins.map(id => tx.object(id)));
    }
    
    // Call extend_blob
    tx.moveCall({
      target: `${WALRUS_PACKAGE}::system::extend_blob`,
      arguments: [
        systemObjRef,
        tx.object(objectId),
        tx.pure.u32(safeEpochs),
        walCoinRef,
      ],
    });
    
    // Execute transaction
    const result = await signAndExecuteTransaction(tx);
    
    console.log(`✅ Blob extended to epoch ${currentExpiry + safeEpochs}`);
    return result;
    
  } catch (error) {
    console.error('Error extending blob:', error);
    throw error;
  }
}
```

### Critical: Shared Object Versioning

When building transactions that interact with shared objects (like the Walrus system object), you **must use the correct version number**.

**Two Different Version Numbers**:

1. **Internal version field** - Logical counter in the Move struct (e.g., "2")
2. **Initial shared version** - Blockchain version when object was first shared (e.g., 317862159)

**The Bug**:
```javascript
// ❌ WRONG - Uses internal version field
const systemObject = await walrusClient.systemObject();
const systemObjRef = tx.sharedObjectRef({
  objectId: systemObjectId,
  initialSharedVersion: systemObject.version, // This is "2" (WRONG!)
  mutable: true,
});
```

**The Fix**:
```javascript
// ✅ CORRECT - Fetches actual initial_shared_version
const fullSystemObject = await client.getObject({
  id: systemObjectId,
  options: { showOwner: true }
});

const initialSharedVersion = fullSystemObject.data.owner.Shared.initial_shared_version;

const systemObjRef = tx.sharedObjectRef({
  objectId: systemObjectId,
  initialSharedVersion: initialSharedVersion, // This is 317862159 (CORRECT!)
  mutable: true,
});
```

**Why This Matters**:
- The `initialSharedVersion` is used by Sui to sequence transactions
- Using the wrong version causes 504 timeouts or invalid object errors
- Always fetch the full object with `showOwner: true` to get the correct value

### Batch Blob Extension

Extending multiple blobs in one transaction (much more efficient):

```javascript
/**
 * Extend multiple blobs in a single transaction
 * @param {Array} blobObjects - Array of {objectId, expiryEpoch}
 * @param {number} extendedEpochs - Epochs to extend each blob
 * @returns {Promise<Object>} Transaction result
 */
export async function extendBlobsBatch(blobObjects, extendedEpochs = 5) {
  const wallet = getWallet();
  const account = getAccount();
  
  if (!wallet || !account) {
    throw new Error('Wallet not connected');
  }
  
  if (!blobObjects || blobObjects.length === 0) {
    throw new Error('No blobs to extend');
  }
  
  console.log(`Extending ${blobObjects.length} blobs by ${extendedEpochs} epochs`);
  
  try {
    const client = new SuiClient({ url: SUI_RPC_URL });
    const walrusClient = new WalrusClient({
      network: WALRUS_NETWORK,
      suiRpcUrl: SUI_RPC_URL,
    });
    
    // Get system state
    const systemState = await walrusClient.systemState();
    const currentEpoch = systemState.committee.epoch;
    const maxEpochsAhead = 52;
    
    console.log(`Current epoch: ${currentEpoch}`);
    
    // Calculate safe extension for each blob
    const extensionPlan = [];
    
    for (const blob of blobObjects) {
      const startOffset = blob.expiryEpoch - currentEpoch;
      const maxSafeExtend = maxEpochsAhead - startOffset;
      const safeEpochs = Math.min(extendedEpochs, maxSafeExtend);
      
      if (safeEpochs <= 0) {
        console.warn(`⚠️ Skipping blob ${blob.objectId}: already at max limit`);
        continue;
      }
      
      extensionPlan.push({
        blob,
        epochs: safeEpochs,
        currentOffset: startOffset,
      });
      
      console.log(
        `✓ Blob ${blob.objectId.slice(0, 10)}... - ` +
        `extending by ${safeEpochs} epochs`
      );
    }
    
    if (extensionPlan.length === 0) {
      throw new Error('No blobs can be extended (all at max limit)');
    }
    
    // Create transaction
    const tx = new Transaction();
    tx.setGasBudget(500_000_000); // 0.5 SUI
    tx.setSender(account.address);
    
    // Get system object and package ID
    const systemObject = await walrusClient.systemObject();
    const systemObjectId = systemObject.id.id;
    const walrusPackageId = systemObject.package_id; // Get current package dynamically
    
    console.log('Using package ID:', walrusPackageId);
    
    // CRITICAL: Fetch full object to get correct initial_shared_version
    const fullSystemObject = await client.getObject({
      id: systemObjectId,
      options: { showOwner: true }
    });
    
    const initialSharedVersion = fullSystemObject.data.owner.Shared.initial_shared_version;
    console.log('Initial shared version:', initialSharedVersion);
    
    const systemObjRef = tx.sharedObjectRef({
      objectId: systemObjectId,
      initialSharedVersion: initialSharedVersion, // Use correct version!
      mutable: true,
    });
    
    // Get and merge WAL coins
    const walCoins = await client.getCoins({
      owner: account.address,
      coinType: WAL_COIN_TYPE,
    });
    
    if (!walCoins.data || walCoins.data.length === 0) {
      throw new Error('No WAL coins found');
    }
    
    // Estimate payment needed
    const estimatedPayment = extensionPlan.reduce(
      (sum, plan) => sum + plan.epochs,
      0
    ) * 1_000_000_000; // 1 WAL per epoch (generous estimate)
    
    // Select sufficient coins
    let coinsToMerge = [];
    let totalBalance = 0;
    
    for (const coin of walCoins.data) {
      coinsToMerge.push(coin);
      totalBalance += parseInt(coin.balance);
      if (totalBalance >= estimatedPayment) break;
    }
    
    if (totalBalance < estimatedPayment) {
      throw new Error(
        `Insufficient WAL balance. Need ~${estimatedPayment / 1e9} WAL, ` +
        `have ${totalBalance / 1e9} WAL`
      );
    }
    
    console.log(`Using ${coinsToMerge.length} WAL coins`);
    
    // Merge coins
    const [primaryCoin, ...otherCoins] = coinsToMerge.map(c => c.coinObjectId);
    let walCoinRef = tx.object(primaryCoin);
    
    if (otherCoins.length > 0) {
      tx.mergeCoins(walCoinRef, otherCoins.map(id => tx.object(id)));
    }
    
    // Add extension for each blob
    for (const plan of extensionPlan) {
      tx.moveCall({
        target: `${walrusPackageId}::system::extend_blob`, // Use dynamic package ID
        arguments: [
          systemObjRef,
          tx.object(plan.blob.objectId),
          tx.pure.u32(plan.epochs),
          walCoinRef,
        ],
      });
    }
    
    // Execute transaction
    console.log('=== TRANSACTION SUMMARY ===');
    console.log(`Total blobs: ${extensionPlan.length}`);
    console.log(`Total epochs: ${extensionPlan.reduce((s, p) => s + p.epochs, 0)}`);
    console.log(`Estimated cost: ~${extensionPlan.reduce((s, p) => s + p.epochs, 0)} WAL`);
    
    const result = await signAndExecuteTransaction(tx);
    
    console.log(`✅ Extended ${extensionPlan.length} blobs successfully`);
    return result;
    
  } catch (error) {
    console.error('Error in batch extension:', error);
    throw error;
  }
}
```

### Usage Example: Auto-Extend Expiring Blobs

A practical example - automatically extend blobs that are about to expire:

```javascript
import { getUserBlobs, getCurrentEpoch } from './services/blob-query.js';
import { extendBlobsBatch } from './services/blob-operations.js';
import { getAccount } from './utils/wallet.js';

async function autoExtendExpiring() {
  const account = getAccount();
  
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }
  
  try {
    // Get current epoch
    const currentEpoch = await getCurrentEpoch();
    console.log('Current epoch:', currentEpoch);
    
    // Get all active blobs
    const blobs = await getUserBlobs(account.address, {
      includeExpired: false
    });
    
    // Find blobs expiring within next 10 epochs
    const expiringThreshold = currentEpoch + 10;
    const expiringSoon = blobs.filter(blob => 
      blob.expiryEpoch <= expiringThreshold
    );
    
    if (expiringSoon.length === 0) {
      console.log('No blobs expiring soon');
      return;
    }
    
    console.log(`Found ${expiringSoon.length} blobs expiring soon`);
    
    // Show details to user
    const message = expiringSoon.map(blob => 
      `- ${blob.title}: expires at epoch ${blob.expiryEpoch}`
    ).join('\n');
    
    const confirmed = confirm(
      `Extend ${expiringSoon.length} blobs by 50 epochs?\n\n${message}`
    );
    
    if (!confirmed) {
      return;
    }
    
    // Extend in batches of 5
    const batchSize = 5;
    let extended = 0;
    
    for (let i = 0; i < expiringSoon.length; i += batchSize) {
      const batch = expiringSoon.slice(i, i + batchSize);
      console.log(`Extending batch ${Math.floor(i / batchSize) + 1}...`);
      
      await extendBlobsBatch(batch, 50); // Extend by 50 epochs
      extended += batch.length;
      
      console.log(`✅ Extended ${batch.length} blobs`);
    }
    
    alert(`Successfully extended ${extended} blobs!`);
    
  } catch (error) {
    console.error('Auto-extend failed:', error);
    alert('Extension failed: ' + error.message);
  }
}

// Run daily check
setInterval(autoExtendExpiring, 24 * 60 * 60 * 1000); // Check daily
```

### Important Considerations for Extending

**WAL Token Requirement**:
- Extensions require WAL tokens for payment
- Get WAL from exchanges or faucets
- Keep sufficient balance for extensions

**Gas Costs**:
- Each extension costs SUI for gas
- Batch operations save gas
- Budget ~0.01-0.05 SUI per blob

**Max Epochs Ahead**:
- Cannot extend too far into future (typically 52 epochs)
- Check current offset before extending
- System will reject violations

**Timing**:
- Extend before expiry to avoid data loss
- Build auto-extend logic for important content
- Monitor epoch progression

**Error Handling**:
- Transaction fails if max_epochs_ahead exceeded
- Transaction fails if insufficient WAL
- Check blob ownership before extending

---

## Advanced Topics

Once you've mastered the basics, these advanced patterns will help you build production-ready applications.

### Detecting the Aggregator

#### The Self-Hosting Pattern

One of Walrus's powerful features is that **web apps can be hosted on Walrus itself**:

1. Upload your HTML/CSS/JS as blobs
2. Serve your app via a Walrus aggregator
3. App can fetch other blobs from the same aggregator

This creates a **fully decentralized web app**:
- No centralized hosting (no AWS, no Vercel)
- App code stored the same way as user data
- Aggregators serve both app and content

#### Why Detect the Aggregator?

**Locality**: If your app is loaded from `https://aggregator-europe.walrus.space`, it's likely faster to fetch blobs from that same aggregator rather than a US-based one.

**Self-Reference**: Apps served from Walrus can reference themselves without hardcoding URLs.

**Fallbacks**: If one aggregator is slow, you can try others.

When your app is served from a Walrus aggregator, you should use that same aggregator for fetching other blobs:

```javascript
export function detectAggregator() {
  const origin = window.location.origin;
  
  // If served from Walrus, use the same aggregator
  if (origin.includes('walrus')) {
    return origin;
  }
  
  // Otherwise use default
  return 'https://aggregator.mainnet.walrus.space';
}
```

### Robust Error Handling

#### Why Redundancy Matters in Decentralized Systems

**Traditional web**: Single point of failure (one CDN, one server)
**Walrus**: Multiple aggregators, any can serve your content

Best practices for production apps:

1. **Multiple Aggregators**: Keep a list of known aggregators
2. **Fallback Strategy**: Try primary, then secondary, then tertiary
3. **Timeout Handling**: Don't wait forever for slow aggregators
4. **Cache Aggressively**: Blob content is immutable, cache forever

#### Common Error Scenarios and Solutions

**Blob Not Found (404)**:
- **Cause**: Blob expired, not yet certified, or invalid ID
- **Solution**: Check blob metadata, verify certification status

**Service Unavailable (503)**:
- **Cause**: Aggregator is down or overloaded
- **Solution**: Implement fallback to alternative aggregators

**Network Timeout**:
- **Cause**: Aggregator response is slow
- **Solution**: Set reasonable timeouts, fallback to faster aggregators

**Invalid Blob ID**:
- **Cause**: Content was never uploaded or ID is malformed
- **Solution**: Validate IDs before fetching, catch and handle gracefully

```javascript
/**
 * Fetch a blob with automatic fallback to backup aggregator
 * @param {string} objectId - Blob object ID
 * @returns {Promise<string>} Blob content
 */
async function robustBlobFetch(objectId) {
  const aggregators = [
    'https://aggregator.mainnet.walrus.space',
    'https://aggregator-backup.mainnet.walrus.space',
    'https://aggregator-eu.mainnet.walrus.space'
  ];
  
  for (let i = 0; i < aggregators.length; i++) {
    try {
      const url = `${aggregators[i]}/v1/blobs/by-object-id/${objectId}`;
      const response = await fetch(url, { timeout: 5000 });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
      
    } catch (error) {
      console.warn(`Aggregator ${i + 1} failed:`, error.message);
      
      // If this was the last aggregator, throw
      if (i === aggregators.length - 1) {
        throw new Error('All aggregators failed');
      }
      
      // Otherwise, continue to next aggregator
      continue;
    }
  }
}
```

### Debugging Sui Transactions

#### Common Errors and Solutions

**Error: 504 Timeout from Full Node**

**Symptoms**: Transaction submission hangs and times out

**Causes**:
- Wrong `initialSharedVersion` for shared objects (most common)
- Invalid object references or IDs
- Type mismatches in Move function calls

**Solutions**:
1. Verify you're using `initial_shared_version` from owner field, not internal version
2. Check all object IDs are valid and owned by the correct address
3. Ensure package ID is current (fetch from system object)

**Error: Object Version Mismatch**

**Symptoms**: Transaction fails with "object version mismatch" error

**Causes**:
- Using stale object versions in transaction
- Race condition with another transaction

**Solutions**:
1. Let the SDK handle versioning: use `tx.object(id)` instead of manual versions
2. For owned objects, SDK auto-fetches latest version during `tx.build()`
3. Retry the transaction with fresh object data

**Error: Invalid Package ID in Move Call**

**Symptoms**: Transaction fails with "function not found" or "module not found"

**Causes**:
- Using hardcoded old package ID after an upgrade
- Incorrect package address in Move call target

**Solutions**:
1. Always fetch current package ID: `systemObject.package_id`
2. Never hardcode package addresses
3. Verify package ID matches the chain you're targeting

#### Debugging Techniques

**1. Inspect Transaction Before Submission**

```javascript
// Log transaction details before signing
const txData = tx.getData();
console.log('Transaction inputs:', txData.inputs);
console.log('Transaction commands:', txData.transactions);
```

**2. Verify Object State**

```javascript
// Check object exists and is in expected state
const obj = await client.getObject({
  id: objectId,
  options: {
    showContent: true,
    showType: true,
    showOwner: true,
  }
});

console.log('Object type:', obj.data.type);
console.log('Object owner:', obj.data.owner);
console.log('Object version:', obj.data.version);

// For shared objects, check initial_shared_version
if (obj.data.owner.Shared) {
  console.log('Initial shared version:', obj.data.owner.Shared.initial_shared_version);
}
```

**3. Check Epoch Calculations**

```javascript
// Verify epoch math for extensions
const currentEpoch = await walrusClient.getEpochNumber();
const currentOffset = blob.expiryEpoch - currentEpoch;
const maxEpochsAheadOffset = 52; // Walrus limit
const maxSafeExtend = maxEpochsAheadOffset - currentOffset;

console.log('Current epoch:', currentEpoch);
console.log('Blob expires at:', blob.expiryEpoch);
console.log('Current offset:', currentOffset);
console.log('Max additional extension:', maxSafeExtend);
```

**4. Add Comprehensive Logging**

```javascript
try {
  console.log('=== Starting Transaction ===');
  console.log('System object ID:', systemObjectId);
  console.log('Package ID:', walrusPackageId);
  console.log('Initial shared version:', initialSharedVersion);
  console.log('User address:', account.address);
  
  const result = await signAndExecuteTransaction(tx);
  
  console.log('=== Transaction Success ===');
  console.log('Digest:', result.digest);
  console.log('Effects:', result.effects);
  
} catch (error) {
  console.error('=== Transaction Failed ===');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  throw error;
}
```

#### Best Practices Checklist

✅ **Package IDs**: Always fetch dynamically from system object
✅ **Shared Objects**: Use `initial_shared_version` from owner field
✅ **Owned Objects**: Let SDK handle versioning with `tx.object(id)`
✅ **Object Inspection**: Use `showOwner: true` to see sharing info
✅ **Logging**: Add comprehensive logs for debugging
✅ **Error Handling**: Catch and log all errors with context
✅ **Verification**: Check object state before building transactions

### Debugging Sui Transactions

#### Common Transaction Errors

**Error: 504 Timeout from Full Node**

**Symptoms**: Transaction submission hangs and eventually times out with a 504 error

**Causes**:
- Wrong `initialSharedVersion` for shared objects (most common)
- Invalid object references or IDs
- Type mismatches in Move function calls

**Solutions**:
1. Verify you're using `initial_shared_version` from the owner field, not internal version
2. Check all object IDs are valid and exist on-chain
3. Ensure package ID is current (fetch from system object dynamically)

**Error: Object Version Mismatch**

**Symptoms**: Transaction fails with "object version mismatch" error

**Causes**:
- Using stale object versions in transaction
- Race condition with another transaction

**Solutions**:
1. Let the SDK handle versioning: use `tx.object(id)` instead of manual versions
2. For owned objects, SDK auto-fetches latest version during `tx.build()`
3. Retry the transaction with fresh object data

**Error: Invalid Package ID**

**Symptoms**: Transaction fails with "function not found" or "module not found"

**Causes**:
- Using hardcoded old package ID after an upgrade
- Incorrect package address

**Solutions**:
1. Always fetch current package ID: `systemObject.package_id`
2. Never hardcode package addresses

#### Debugging Techniques

**1. Inspect Transaction Before Submission**

```javascript
const txData = tx.getData();
console.log('Transaction inputs:', txData.inputs);
console.log('Transaction commands:', txData.transactions);
```

**2. Verify Object State**

```javascript
const obj = await client.getObject({
  id: objectId,
  options: { showContent: true, showType: true, showOwner: true }
});
console.log('Object type:', obj.data.type);
console.log('Object owner:', obj.data.owner);
```

**3. Add Comprehensive Logging**

```javascript
try {
  console.log('=== Starting Transaction ===');
  console.log('System object ID:', systemObjectId);
  console.log('Package ID:', walrusPackageId);
  
  const result = await signAndExecuteTransaction(tx);
  console.log('=== Transaction Success ===');
  console.log('Digest:', result.digest);
  
} catch (error) {
  console.error('=== Transaction Failed ===');
  console.error('Error:', error.message);
  throw error;
}
```

#### Best Practices Checklist

✅ **Package IDs**: Fetch dynamically from system object
✅ **Shared Objects**: Use `initial_shared_version` from owner field
✅ **Owned Objects**: Let SDK handle versioning with `tx.object(id)`
✅ **Logging**: Add comprehensive logs for debugging
✅ **Verification**: Check object state before transactions

---

## Complete Examples

These end-to-end examples demonstrate how to combine the concepts from this tutorial into working applications.

### Example 1: Simple Content Viewer

A minimal viewer that displays blob content with metadata:

```javascript
import { fetchBlob } from './utils/walrus.js';
import { getBlobMetadata, getPageTitle } from './services/blob-metadata.js';

async function viewContent(objectId) {
  try {
    // Fetch metadata and content in parallel
    const [content, metadata, title] = await Promise.all([
      fetchBlob(objectId),
      getBlobMetadata(objectId),
      getPageTitle(objectId)
    ]);
    
    // Display in UI
    document.getElementById('title').textContent = title || 'Untitled';
    document.getElementById('content').textContent = content;
    document.getElementById('expiry').textContent = `Expires: Epoch ${metadata.expiryEpoch}`;
    
  } catch (error) {
    console.error('Error loading content:', error);
    alert('Failed to load content: ' + error.message);
  }
}

// Usage
const objectId = new URLSearchParams(window.location.search).get('id');
if (objectId) {
  viewContent(objectId);
}
```

### Example 2: Content Upload Form

A complete upload form with content type selection and wallet integration:

```html
<form id="upload-form">
  <input type="text" id="title" placeholder="Page title" required>
  <textarea id="content" placeholder="Page content" required></textarea>
  <select id="content-type">
    <option value="text/markdown">Markdown</option>
    <option value="text/html">HTML</option>
    <option value="text/plain">Plain Text</option>
  </select>
  <button type="submit">Upload to Walrus</button>
</form>

<script type="module">
import { connectWallet, getAccount } from './utils/wallet.js';
import { uploadToWalrus } from './services/walrus-upload.js';

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Connect wallet if not connected
  const account = getAccount();
  if (!account) {
    await connectWallet();
  }
  
  // Get form values
  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;
  const contentType = document.getElementById('content-type').value;
  
  try {
    const result = await uploadToWalrus(content, {
      title,
      contentType,
      epochs: 50,
      deletable: false
    });
    
    alert(`Upload successful! Object ID: ${result.objectId}`);
    
    // Redirect to view page
    window.location.href = `view.html?id=${result.objectId}`;
    
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed: ' + error.message);
  }
});
</script>
```

### Example 3: User Dashboard

A dashboard that lists all blobs owned by the connected wallet:

```javascript
import { connectWallet, getAccount } from './utils/wallet.js';
import { getUserBlobs } from './services/blob-query.js';
import { fetchBlob } from './utils/walrus.js';

async function loadDashboard() {
  const account = getAccount();
  
  if (!account) {
    document.getElementById('content').innerHTML = 
      '<button onclick="connectWallet()">Connect Wallet</button>';
    return;
  }
  
  // Show loading state
  document.getElementById('content').innerHTML = '<p>Loading your pages...</p>';
  
  try {
    const blobs = await getUserBlobs(account.address);
    
    if (blobs.length === 0) {
      document.getElementById('content').innerHTML = 
        '<p>No pages yet. <a href="create.html">Create your first page!</a></p>';
      return;
    }
    
    // Render blob list
    const html = blobs.map(blob => `
      <div class="blob-card">
        <h3>${blob.title}</h3>
        <p>Object ID: ${blob.objectId}</p>
        <p>Type: ${blob.contentType}</p>
        <p>Expiry: Epoch ${blob.expiryEpoch}</p>
        <a href="view.html?id=${blob.objectId}">View</a>
      </div>
    `).join('');
    
    document.getElementById('content').innerHTML = html;
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    document.getElementById('content').innerHTML = 
      `<p>Error: ${error.message}</p>`;
  }
}

// Load dashboard on page load
loadDashboard();
```

---

## Summary

Congratulations! You've learned how to build web applications with Walrus decentralized storage.

### What You've Learned

1. ✅ **Setup & Configuration**: Install dependencies and configure network constants
2. ✅ **Wallet Integration**: Connect Sui wallets using the Wallet Standard
3. ✅ **Reading Blobs**: Fetch content from aggregators via HTTP
4. ✅ **Metadata Queries**: Read ownership, expiry, and attributes from Sui blockchain
5. ✅ **Uploading Content**: Create blobs with custom attributes and storage duration
6. ✅ **User Queries**: Find all blobs owned by a wallet address
7. ✅ **Blob Deletion**: Burn deletable blobs and reclaim storage funds
8. ✅ **Storage Extension**: Add epochs to keep blobs alive longer
9. ✅ **Advanced Patterns**: Aggregator detection, fallbacks, and batch operations

### Key Principles

- **Content Lives Off-Chain**: Blobs stored on Walrus network, accessed via aggregators
- **Metadata Lives On-Chain**: Ownership, expiry, and attributes stored on Sui blockchain
- **Reads Are Free**: Anyone can fetch blob content without a wallet
- **Writes Require Signatures**: Uploads, extensions, and deletions need wallet signatures
- **Epoch-Based Economics**: Pay for storage in time periods, not monthly subscriptions
- **Flexible Attributes**: Attach custom key-value metadata to any blob

### Next Steps

Now that you understand the fundamentals, consider building:

- **Decentralized Blog Platform**: Upload markdown posts, manage them via wallet
- **NFT Metadata Storage**: Store NFT images and metadata on Walrus
- **Version Control System**: Track document versions as immutable blobs
- **Social Media App**: User-owned content with cryptographic verification
- **Decentralized CDN**: Serve static assets from Walrus aggregators
- **Backup Service**: Automated blob extension for critical data

### Additional Resources

**Official Documentation**:
- [Walrus Documentation](https://docs.walrus.site/) — Complete Walrus guide
- [Sui Documentation](https://docs.sui.io/) — Sui blockchain fundamentals
- [@mysten/walrus SDK](https://www.npmjs.com/package/@mysten/walrus) — TypeScript SDK reference
- [Wallet Standard](https://github.com/wallet-standard/wallet-standard) — Multi-wallet integration

**Community**:
- [Sui Discord](https://discord.gg/sui) — Get help and connect with developers
- [Walrus Testnet Faucet](https://discord.gg/sui) — Request test tokens

---

**Happy building on Walrus! 🦭**
