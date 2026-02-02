/**
 * Admin Panel for managing expired blobs
 */

import { getAccount, subscribeToWalletChanges } from './utils/wallet.js';
import { fetchAllBlobs } from './utils/api.js';
import { deleteBlobsBatch } from './utils/batch-operations.js';
import { WalrusClient } from '@mysten/walrus';
import { showLoading, hideLoading, showError } from './utils/notifications.js';
import { getSuiRpcUrl } from './utils/settings.js';
import { 
  createAdminBlobCard, 
  attachAdminCardHandlers 
} from './components/blob-card.js';
import { mountWalletConnectButton } from './dapp-kit/connect-button.jsx';

// State
let allBlobs = [];
let expiredBlobs = [];
let uncertifiedBlobs = [];
let selectedBlobs = new Set();
let currentEpoch = 0;

// UI Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const expiredCountEl = document.getElementById('expired-count');
const uncertifiedCountEl = document.getElementById('uncertified-count');
const selectedCountEl = document.getElementById('selected-count');
const currentEpochEl = document.getElementById('current-epoch');
const expiredBlobsEl = document.getElementById('expired-blobs');
const batchActionsEl = document.getElementById('batch-actions');
const burnSelectedBtn = document.getElementById('burn-selected');
const selectAllBtn = document.getElementById('select-all');
const clearSelectionBtn = document.getElementById('clear-selection');
const burnCountEl = document.getElementById('burn-count');
mountWalletConnectButton('wallet-connect-root');

const adminWalletState = {
  lastConnectedAddress: null,
  loadingData: false,
};

subscribeToWalletChanges(async ({ isConnected, address }) => {
  if (isConnected && address) {
    if (adminWalletState.lastConnectedAddress !== address && !adminWalletState.loadingData) {
      adminWalletState.lastConnectedAddress = address;
      adminWalletState.loadingData = true;
      try {
        await loadData();
      } catch (error) {
        console.error('Failed to load admin data:', error);
        showError('Failed to load data: ' + error.message);
      } finally {
        adminWalletState.loadingData = false;
      }
    }
  } else {
    adminWalletState.lastConnectedAddress = null;
    if (!adminWalletState.loadingData) {
      hideLoading();
    }
  }
});


function updateStats() {
  expiredCountEl.textContent = expiredBlobs.length;
  uncertifiedCountEl.textContent = uncertifiedBlobs.length;
  selectedCountEl.textContent = selectedBlobs.size;
  burnCountEl.textContent = selectedBlobs.size;
  currentEpochEl.textContent = currentEpoch;
}

function updateBatchActions() {
  if (selectedBlobs.size > 0) {
    batchActionsEl.style.display = 'flex';
  } else {
    batchActionsEl.style.display = 'none';
  }
  updateStats();
}

function createBlobCard(blob) {
  // Create card using component
  const card = createAdminBlobCard(blob, currentEpoch, selectedBlobs);
  
  // Attach event handlers
  attachAdminCardHandlers(
    card, 
    blob, 
    selectedBlobs, 
    updateBatchActions, 
    handleBurnSingle
  );
  
  return card;
}

function renderExpiredBlobs() {
  expiredBlobsEl.innerHTML = '';
  
  if (expiredBlobs.length === 0) {
    expiredBlobsEl.innerHTML = '<div class="empty-state">No expired or uncertified blobs found 🎉</div>';
    return;
  }
  
  expiredBlobs.forEach(blob => {
    expiredBlobsEl.appendChild(createBlobCard(blob));
  });
}

async function loadData() {
  showLoading('Loading blobs and current epoch...');
  
  try {
    // Get current epoch
    const suiRpcUrl = getSuiRpcUrl();
    const walrusClient = new WalrusClient({
      network: 'mainnet',
      suiRpcUrl: suiRpcUrl,
    });
    
    const systemState = await walrusClient.systemState();
    currentEpoch = systemState.committee.epoch;
    
    console.log('Current epoch:', currentEpoch);
    
    // Fetch ALL blobs (no content-type filtering for admin)
    allBlobs = await fetchAllBlobs();
    console.log('All blobs:', allBlobs.length);
    
    // Filter expired blobs
    const expiredOnly = allBlobs.filter(blob => blob.expiryEpoch < currentEpoch);
    
    // Filter uncertified non-expired blobs
    uncertifiedBlobs = allBlobs.filter(blob => 
      blob.expiryEpoch >= currentEpoch && blob.isUncertified
    );
    
    // Combine expired and uncertified for deletion
    expiredBlobs = [...expiredOnly, ...uncertifiedBlobs];
    
    console.log('Expired blobs:', expiredOnly.length);
    console.log('Uncertified non-expired blobs:', uncertifiedBlobs.length);
    console.log('Total deletable blobs:', expiredBlobs.length);
    
    if (uncertifiedBlobs.length > 0) {
      console.warn('⚠️ Found uncertified blobs:', uncertifiedBlobs);
    }
    
    // Render
    renderExpiredBlobs();
    updateStats();
    hideLoading();
    
  } catch (error) {
    console.error('Error loading data:', error);
    showError('Failed to load blobs: ' + error.message);
  }
}

async function handleBurnSingle(blob) {
  if (!confirm(`Are you sure you want to burn "${blob.name || 'Untitled'}"?\n\nThis action cannot be undone.`)) {
    return;
  }
  
  showLoading('Burning blob...');
  
  try {
    const blobObjects = [{
      objectId: blob.objectId,
      version: blob.version,
      digest: blob.digest,
    }];
    
    await deleteBlobsBatch(blobObjects);
    
    showLoading('Blob burned successfully! Reloading...');
    
    // Reload after delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('Error burning blob:', error);
    showError('Failed to burn blob: ' + error.message);
  }
}

async function handleBurnSelected() {
  if (selectedBlobs.size === 0) return;
  
  const confirmed = confirm(
    `⚠️ WARNING: You are about to burn ${selectedBlobs.size} expired blob(s).\n\n` +
    `This action is PERMANENT and CANNOT be undone.\n\n` +
    `Are you sure you want to continue?`
  );
  
  if (!confirmed) return;
  
  showLoading(`Burning ${selectedBlobs.size} blob(s)...`);
  
  try {
    // Get full blob objects for selected blobs
    const blobObjects = expiredBlobs
      .filter(blob => selectedBlobs.has(blob.objectId))
      .map(blob => ({
        objectId: blob.objectId,
        version: blob.version,
        digest: blob.digest,
      }));
    
    console.log('Burning blobs:', blobObjects);
    
    await deleteBlobsBatch(blobObjects);
    
    // Clear selection
    selectedBlobs.clear();
    updateBatchActions();
    
    showLoading('Blobs burned successfully! Reloading...');
    
    // Reload after delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('Error burning blobs:', error);
    showError('Failed to burn blobs: ' + error.message);
  }
}

function handleSelectAll() {
  expiredBlobs.forEach(blob => selectedBlobs.add(blob.objectId));
  renderExpiredBlobs();
  updateBatchActions();
}

function handleClearSelection() {
  selectedBlobs.clear();
  renderExpiredBlobs();
  updateBatchActions();
}

// Event listeners
burnSelectedBtn.addEventListener('click', handleBurnSelected);
selectAllBtn.addEventListener('click', handleSelectAll);
clearSelectionBtn.addEventListener('click', handleClearSelection);

// Initialize
async function init() {
  console.log('Initializing admin panel...');
  
  const account = getAccount();
  if (account) {
    // Wallet already connected, load data
    try {
      adminWalletState.lastConnectedAddress = account.address;
      adminWalletState.loadingData = true;
      await loadData();
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data: ' + error.message);
    } finally {
      adminWalletState.loadingData = false;
    }
  } else {
    // Show connect wallet button
    hideLoading();
  }
}

init();
