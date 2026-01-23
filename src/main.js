/**
 * Walrus Pages - Main Application Entry Point
 */

import './styles/main.css';
import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';

import { getPageId, showView, getAddress } from './utils/router.js';
import { fetchBlob } from './utils/walrus.js';
import { renderMarkdown } from './utils/markdown.js';
import { 
  connectWallet, 
  disconnectWallet, 
  isWalletConnected,
  getWalletAddress,
  restoreWalletConnection
} from './utils/wallet.js';
import {
  showLoading,
  hideLoading,
  showError,
  showSuccess,
  updateWalletButton,
  showMyPagesButton,
  showMyPagesSection
} from './utils/notifications.js';
import { 
  uploadToWalrus, 
  getBlobMetadata as getMetadata,
  getContentType,
  getPageTitle,
  extendBlobStorage,
  getUserBlobs,
  calculateStorageCost 
} from './utils/upload.js';
import { 
  extendBlobsBatch,
  deleteBlobsBatch
} from './utils/batch-operations.js';
import { initSettingsModal } from './components/settings-modal.js';
import { WAL_COIN_TYPE } from './config/constants.js';

// Global state
let editor = null;
let currentPageObjectId = null; // Track current page for extension
let currentPageOwner = null; // Track current page owner for tipping
let currentPageMetadata = null; // Track metadata for extension calculations
let selectedBlobs = new Set(); // Track selected blob object IDs
let currentBlobs = []; // Store current blob list

// Initialize app
async function init() {
  // Initialize settings modal
  initSettingsModal();
  
  // Try to restore wallet connection from previous session
  const restoredAddress = await restoreWalletConnection();
  if (restoredAddress) {
    // Ensure DOM is ready before updating UI
    await new Promise(resolve => setTimeout(resolve, 0));
    updateWalletButton(true, restoredAddress);
    showMyPagesButton(true);
    updateProfileLink(restoredAddress);
  }
  
  const pageId = getPageId();
  const addressParam = getAddress();
  
  if (pageId) {
    // Show viewer mode
    await loadPage(pageId);
  } else if (addressParam) {
    // Show address view
    await loadAddressView(addressParam);
  } else {
    // Show landing page
    showView('landing');
    
    // Load user's pages if wallet was restored
    if (restoredAddress) {
      await loadUserPages();
    }
  }
  
  setupEventListeners();
}

// Load address view
async function loadAddressView(address) {
  showView('address-view');
  
  const titleEl = document.getElementById('address-title');
  const explorerLinkEl = document.getElementById('address-explorer-link');
  const listEl = document.getElementById('address-pages-list');
  
  if (titleEl) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    titleEl.textContent = `Pages Published by ${shortAddress}`;
  }
  
  if (explorerLinkEl) {
    explorerLinkEl.href = `https://suivision.xyz/account/${address}`;
    explorerLinkEl.style.display = 'inline-flex';
  }
  
  if (!listEl) return;
  
  listEl.innerHTML = '<div class="loading">Loading pages...</div>';
  
  try {
    // Query blobs for this address
    const blobs = await getUserBlobs(address);
    
    if (blobs.length === 0) {
      listEl.innerHTML = '<p class="info-text">No published pages found.</p>';
      return;
    }
    
    // Filter to only show blobs where sender matches the address (their "My Pages")
    const myPages = blobs.filter(blob => 
      blob.sender && blob.sender.toLowerCase() === address.toLowerCase()
    );
    
    if (myPages.length === 0) {
      listEl.innerHTML = '<p class="info-text">No published pages found.</p>';
      return;
    }
    
    // Render page cards (read-only, no checkboxes)
    let html = '';
    for (const blob of myPages) {
      html += `
        <div class="page-card">
          <div class="page-card-header">
            <div class="page-title-section">
              <h3>
                <a href="?page=${blob.objectId}" class="page-title-link">${blob.title || 'Untitled'}</a>
              </h3>
            </div>
            <span class="expiry-epoch">Epoch ${blob.expiryEpoch || 'N/A'}</span>
          </div>
          <div class="page-actions">
            <button class="btn-primary btn-small" onclick="window.location.href='?page=${blob.objectId}'">View</button>
          </div>
        </div>
      `;
    }
    listEl.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading address pages:', error);
    listEl.innerHTML = '<p class="info-text">Failed to load pages</p>';
  }
}

// Load and display a page
async function loadPage(objectId) {
  showView('viewer');
  showLoading('Loading page...');
  currentPageObjectId = objectId; // Store for extension feature
  
  try {
    // Fetch blob content
    const content = await fetchBlob(objectId);
    
    // Always render as markdown
    const html = renderMarkdown(content);
    const contentEl = document.getElementById('content');
    if (contentEl) {
      contentEl.innerHTML = html;
    }
    
    // Fetch and display metadata (only if objectId starts with 0x)
    // Blob IDs are base64 encoded and don't start with 0x
    const pageTitleEl = document.getElementById('page-title-display');
    const expiryEl = document.getElementById('expiry-time');
    const suiExplorerLink = document.getElementById('sui-explorer-link');
    const tipOwnerBtn = document.getElementById('tip-owner-btn');
    const ownerLink = document.getElementById('owner-link');
    
    if (objectId.startsWith('0x')) {
      try {
        const metadata = await getMetadata(objectId);
        currentPageMetadata = metadata; // Store for extension calculations
        
        if (expiryEl && metadata.expiryEpoch) {
          expiryEl.textContent = `Expiry epoch ${metadata.expiryEpoch}`;
        }
        
        // Store owner for tipping and display owner link
        if (metadata.owner && typeof metadata.owner === 'object' && metadata.owner.AddressOwner) {
          currentPageOwner = metadata.owner.AddressOwner;
          if (tipOwnerBtn) {
            tipOwnerBtn.style.display = 'inline-block';
          }
          // Display owner icon with link to SuiVision
          if (ownerLink) {
            ownerLink.href = `https://suivision.xyz/account/${currentPageOwner}`;
            ownerLink.title = `Owner: ${currentPageOwner}`;
            ownerLink.style.display = 'inline-flex';
          }
        }
        
        // Set up Sui explorer link
        if (suiExplorerLink) {
          suiExplorerLink.href = `https://suivision.xyz/object/${objectId}`;
          suiExplorerLink.style.display = 'inline-block';
        }
        
        // Fetch page title from attributes
        if (pageTitleEl) {
          const pageTitle = await getPageTitle(objectId);
          if (pageTitle) {
            pageTitleEl.textContent = pageTitle;
            pageTitleEl.style.display = 'block';
          } else {
            pageTitleEl.style.display = 'none';
          }
        }
      } catch (metaError) {
        console.error('Error fetching metadata:', metaError);
        if (expiryEl) {
          expiryEl.textContent = 'Unknown';
        }
      }
    } else {
      // For blob IDs, we can't fetch metadata from the blockchain
      if (expiryEl) {
        expiryEl.textContent = 'Unknown';
      }
    }
    
    hideLoading();
  } catch (error) {
    console.error('Error loading page:', error);
    showError(`Failed to load page: ${error.message}`);
    showView('landing');
  }
}

// Set up event listeners
function setupEventListeners() {
  // Create buttons
  const createBtn = document.getElementById('create-btn');
  const createLandingBtn = document.getElementById('create-landing-btn');
  const getStartedBtn = document.getElementById('get-started-btn');
  
  if (createBtn) {
    createBtn.addEventListener('click', openEditor);
  }
  
  if (createLandingBtn) {
    createLandingBtn.addEventListener('click', openEditor);
  }
  
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', openEditor);
  }
  
  // Editor modal buttons
  const closeEditorBtn = document.getElementById('close-editor-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const publishBtn = document.getElementById('publish-btn');
  
  if (closeEditorBtn) {
    closeEditorBtn.addEventListener('click', closeEditor);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditor);
  }
  
  if (publishBtn) {
    publishBtn.addEventListener('click', publishPage);
  }
  
  // Wallet button
  const walletBtn = document.getElementById('wallet-btn');
  if (walletBtn) {
    walletBtn.addEventListener('click', toggleWallet);
  }
  
  // My Pages button
  const myPagesBtn = document.getElementById('my-pages-btn');
  if (myPagesBtn) {
    myPagesBtn.addEventListener('click', () => {
      const address = getWalletAddress();
      if (address) {
        window.location.href = `?address=${address}`;
      }
    });
  }
  
  // Browse Address button (always visible)
  const browseAddressBtn = document.getElementById('browse-address-btn');
  if (browseAddressBtn) {
    browseAddressBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAddressInputPanel();
    });
  }
  
  // Address input panel buttons
  const viewAddressBtn = document.getElementById('view-address-btn');
  const cancelAddressBtn = document.getElementById('cancel-address-btn');
  const addressInput = document.getElementById('other-address-input');
  
  if (viewAddressBtn) {
    viewAddressBtn.addEventListener('click', () => {
      const address = addressInput?.value?.trim();
      if (address) {
        window.location.href = `?address=${address}`;
      }
    });
  }
  
  if (cancelAddressBtn) {
    cancelAddressBtn.addEventListener('click', () => {
      hideAddressInputPanel();
    });
  }
  
  if (addressInput) {
    addressInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const address = addressInput.value.trim();
        if (address) {
          window.location.href = `?address=${address}`;
        }
      }
    });
  }
  
  // Extend button
  const extendBtn = document.getElementById('extend-btn');
  if (extendBtn) {
    extendBtn.addEventListener('click', extendBlob);
  }
  
  // Copy link button
  const copyLinkBtn = document.getElementById('copy-link-btn');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', copyPageLink);
  }
  
  // Tip owner button
  const tipOwnerBtn = document.getElementById('tip-owner-btn');
  if (tipOwnerBtn) {
    tipOwnerBtn.addEventListener('click', openTipModal);
  }
  
  // Tip modal buttons
  const closeTipBtn = document.getElementById('close-tip-btn');
  const cancelTipBtn = document.getElementById('cancel-tip-btn');
  if (closeTipBtn) {
    closeTipBtn.addEventListener('click', closeTipModal);
  }
  if (cancelTipBtn) {
    cancelTipBtn.addEventListener('click', closeTipModal);
  }
  
  // Tip amount buttons
  document.querySelectorAll('.tip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      sendTip(amount);
    });
  });
}

// Open editor modal
function openEditor() {
  const modal = document.getElementById('editor-modal');
  const titleInput = document.getElementById('page-title-input');
  
  if (modal) {
    modal.classList.remove('hidden');
  }
  
  // Clear previous content
  if (titleInput) {
    titleInput.value = '';
  }
  
  // Initialize EasyMDE if not already initialized
  if (!editor) {
    const textarea = document.getElementById('markdown-editor');
    if (textarea) {
      editor = new EasyMDE({
        element: textarea,
        spellChecker: false,
        placeholder: 'Write your content in Markdown...',
        autofocus: true,
        toolbar: [
          'bold', 'italic', 'heading', '|',
          'quote', 'unordered-list', 'ordered-list', '|',
          'link', 'image', '|',
          'preview', 'side-by-side', 'fullscreen', '|',
          'guide'
        ],
      });
    }
  } else {
    editor.value('');
  }
}

// Close editor modal
function closeEditor() {
  const modal = document.getElementById('editor-modal');
  const titleInput = document.getElementById('page-title-input');
  
  if (modal) {
    modal.classList.add('hidden');
  }
  
  // Clear inputs
  if (titleInput) {
    titleInput.value = '';
  }
  
  if (editor) {
    editor.value('');
  }
}

// Publish page to Walrus
async function publishPage() {
  if (!editor) return;
  
  const content = editor.value().trim();
  
  if (!content) {
    showError('Please write some content before publishing');
    return;
  }
  
  // Check wallet connection - use getWalletAddress to verify actual connection
  const walletAddress = getWalletAddress();
  if (!walletAddress || !isWalletConnected()) {
    showError('Please connect your wallet to publish');
    // Try to connect wallet
    try {
      await handleWalletConnect();
      // Re-check after connection attempt
      if (!getWalletAddress() || !isWalletConnected()) {
        return;
      }
    } catch (error) {
      return;
    }
  }
  
  showLoading('Publishing to Walrus...');
  
  try {
    // Get the title from input
    const titleInput = document.getElementById('page-title-input');
    const title = titleInput ? titleInput.value.trim() : '';
    
    console.log('📝 Title input element:', titleInput);
    console.log('📝 Title raw value:', titleInput?.value);
    console.log('📝 Title trimmed:', title);
    console.log('📝 Title is truthy:', !!title);
    console.log('📝 Publishing with title:', title);
    
    // Calculate storage cost
    const encoder = new TextEncoder();
    const sizeBytes = encoder.encode(content).length;
    const cost = await calculateStorageCost(sizeBytes);
    
    console.log(`Storage cost: ${cost.costWAL} WAL for ${cost.epochs} epochs`);
    
    // Upload to Walrus with title
    console.log('📤 About to call uploadToWalrus with options:', { title });
    const result = await uploadToWalrus(content, { title });
    const objectId = result.objectId; // Use object ID for immediate access
    
    console.log('Published blob:', { blobId: result.blobId, objectId: result.objectId });
    
    showSuccess('Page published successfully!');
    closeEditor();
    
    // Redirect to the newly published page using object ID
    // Object IDs are immediately available, blob IDs require certification
    window.location.href = `?page=${objectId}`;
    
  } catch (error) {
    console.error('Publish error:', error);
    showError(`Failed to publish: ${error.message}`);
  }
}

// Update profile link with user address
function updateProfileLink(address) {
  const profileLink = document.getElementById('my-profile-link');
  if (profileLink && address) {
    profileLink.href = `?address=${address}`;
  }
}

// Toggle address input panel
function toggleAddressInputPanel() {
  const panel = document.getElementById('address-input-panel');
  const input = document.getElementById('other-address-input');
  if (panel) {
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      if (input) {
        input.value = '';
        input.focus();
      }
    } else {
      panel.classList.add('hidden');
    }
  }
}

// Hide address input panel
function hideAddressInputPanel() {
  const panel = document.getElementById('address-input-panel');
  if (panel) {
    panel.classList.add('hidden');
  }
}

// Toggle wallet connection
async function toggleWallet() {
  if (isWalletConnected()) {
    disconnectWallet();
    updateWalletButton(false);
    showMyPagesButton(false);
    showMyPagesSection(false);
  } else {
    await handleWalletConnect();
  }
}

// Handle wallet connection
async function handleWalletConnect() {
  showLoading('Connecting wallet...');
  
  try {
    const address = await connectWallet();
    updateWalletButton(true, address);
    showMyPagesButton(true);
    updateProfileLink(address);
    hideLoading();
    
    // Load user's pages if on landing view
    const currentView = document.querySelector('.view:not(.hidden)');
    if (currentView && currentView.id === 'landing') {
      await loadUserPages();
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
    showError(error.message);
  }
}

// Load user's pages
async function loadUserPages() {
  showMyPagesSection(true);
  
  const myPagesListEl = document.getElementById('my-pages-list');
  const sentPagesListEl = document.getElementById('sent-pages-list');
  const sentPagesContainer = document.getElementById('sent-pages-container');
  
  if (!myPagesListEl) return;
  
  myPagesListEl.innerHTML = '<div class="loading">Loading your pages...</div>';
  
  try {
    const address = getWalletAddress();
    if (!address) {
      throw new Error('No wallet address');
    }
    
    // Query user's blob objects
    const blobs = await getUserBlobs(address);
    
    if (blobs.length === 0) {
      myPagesListEl.innerHTML = '<p class="info-text">No pages found. Create your first page!</p>';
      return;
    }
    
    // Separate blobs by sender
    const myPages = [];
    const sentPages = [];
    
    for (const blob of blobs) {
      if (blob.sender && blob.sender.toLowerCase() === address.toLowerCase()) {
        myPages.push(blob);
      } else {
        sentPages.push(blob);
      }
    }
    
    // Store all blobs for selection
    currentBlobs = blobs;
    
    // Render My Pages
    if (myPages.length === 0) {
      myPagesListEl.innerHTML = '<p class="info-text">No pages created yet. Create your first page!</p>';
    } else {
      let myPagesHtml = '';
      for (const blob of myPages) {
        myPagesHtml += `
          <div class="page-card">
            <div class="page-card-header">
              <input type="checkbox" class="blob-checkbox" data-blob-id="${blob.objectId}" />
              <h3><a href="?page=${blob.objectId}" class="page-title-link">${blob.title || 'Untitled'}</a></h3>
              <span class="expiry-epoch">Epoch ${blob.expiryEpoch || 'N/A'}</span>
            </div>
            <div class="page-actions">
              <button class="btn-primary btn-small" onclick="window.location.href='?page=${blob.objectId}'">View</button>
            </div>
          </div>
        `;
      }
      myPagesListEl.innerHTML = myPagesHtml;
      
      // Add batch action buttons for My Pages
      const myPagesBatchActionsHtml = `
        <div id="my-pages-batch-actions" class="batch-actions hidden">
          <span id="my-pages-selection-count">0 blobs selected</span>
          <button id="my-pages-extend-selected-btn" class="btn-primary">Extend Selected</button>
          <button id="my-pages-delete-selected-btn" class="btn-secondary">Delete Selected</button>
        </div>
      `;
      myPagesListEl.insertAdjacentHTML('afterend', myPagesBatchActionsHtml);
    }
    
    // Render Received Pages
    if (sentPages.length > 0 && sentPagesListEl && sentPagesContainer) {
      sentPagesContainer.classList.remove('hidden');
      
      let sentPagesHtml = '';
      for (const blob of sentPages) {
        const txLink = blob.txDigest ? `<a href="https://suivision.xyz/txblock/${blob.txDigest}" target="_blank" rel="noopener" class="tx-link-icon" title="View sending transaction">📜</a>` : '';
        sentPagesHtml += `
          <div class="page-card">
            <div class="page-card-header">
              <input type="checkbox" class="blob-checkbox" data-blob-id="${blob.objectId}" />
              <div class="page-title-section">
                <h3>
                  <a href="?page=${blob.objectId}" class="page-title-link">${blob.title || 'Untitled'}</a>
                  ${txLink}
                </h3>
              </div>
              <span class="expiry-epoch">Epoch ${blob.expiryEpoch || 'N/A'}</span>
            </div>
            <div class="page-actions">
              <button class="btn-secondary btn-small accept-page-btn" data-object-id="${blob.objectId}">✓ Accept</button>
              <button class="btn-primary btn-small" onclick="window.location.href='?page=${blob.objectId}'">View</button>
            </div>
          </div>
        `;
      }
      sentPagesListEl.innerHTML = sentPagesHtml;
      
      // Add batch action buttons for Received Pages
      const sentPagesBatchActionsHtml = `
        <div id="sent-pages-batch-actions" class="batch-actions hidden">
          <span id="sent-pages-selection-count">0 blobs selected</span>
          <button id="sent-pages-extend-selected-btn" class="btn-primary">Extend Selected</button>
          <button id="sent-pages-delete-selected-btn" class="btn-secondary">Delete Selected</button>
        </div>
      `;
      sentPagesListEl.insertAdjacentHTML('afterend', sentPagesBatchActionsHtml);
      
      // Setup accept button listeners
      setupAcceptButtons();
    }
    
    // Setup checkbox event listeners for both sections
    setupBlobSelection();
    
  } catch (error) {
    console.error('Error loading user pages:', error);
    myPagesListEl.innerHTML = '<p class="info-text">Failed to load pages</p>';
  }
}

// Setup accept button listeners
function setupAcceptButtons() {
  const acceptButtons = document.querySelectorAll('.accept-page-btn');
  acceptButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const objectId = button.dataset.objectId;
      await acceptPage(objectId);
    });
  });
}

// Accept a sent page by transferring it to self
async function acceptPage(objectId) {
  const address = getWalletAddress();
  if (!address) {
    showError('Please connect your wallet');
    return;
  }
  
  const confirmed = confirm('Accept this page? This will transfer it to you, making it appear under "My Pages".');
  if (!confirmed) return;
  
  showLoading('Accepting page...');
  
  try {
    const { Transaction } = await import('@mysten/sui/transactions');
    const { signAndExecuteTransaction } = await import('./utils/wallet.js');
    
    // Create a transaction to transfer the object to self
    const tx = new Transaction();
    tx.setGasBudget(100_000_000); // 0.1 SUI
    tx.transferObjects([tx.object(objectId)], tx.pure.address(address));
    
    // Sign and execute the transaction
    const result = await signAndExecuteTransaction(tx);
    
    console.log('Accept transaction result:', result);
    
    if (result.effects?.status?.status === 'success') {
      showSuccess('Page accepted successfully!');
      
      // Wait for blockchain confirmation and reload
      setTimeout(async () => {
        await loadUserPages();
      }, 2000);
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    console.error('Error accepting page:', error);
    showError(`Failed to accept page: ${error.message}`);
  }
}

// Setup blob selection management
function setupBlobSelection() {
  selectedBlobs.clear();
  
  // Handle checkbox changes
  const checkboxes = document.querySelectorAll('.blob-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const blobId = e.target.dataset.blobId;
      if (e.target.checked) {
        selectedBlobs.add(blobId);
      } else {
        selectedBlobs.delete(blobId);
      }
      updateBatchActions();
    });
  });
  
  // Handle batch action buttons for My Pages
  const myPagesExtendBtn = document.getElementById('my-pages-extend-selected-btn');
  const myPagesDeleteBtn = document.getElementById('my-pages-delete-selected-btn');
  
  if (myPagesExtendBtn) {
    myPagesExtendBtn.addEventListener('click', handleExtendSelected);
  }
  if (myPagesDeleteBtn) {
    myPagesDeleteBtn.addEventListener('click', handleDeleteSelected);
  }
  
  // Handle batch action buttons for Received Pages
  const sentPagesExtendBtn = document.getElementById('sent-pages-extend-selected-btn');
  const sentPagesDeleteBtn = document.getElementById('sent-pages-delete-selected-btn');
  
  if (sentPagesExtendBtn) {
    sentPagesExtendBtn.addEventListener('click', handleExtendSelected);
  }
  if (sentPagesDeleteBtn) {
    sentPagesDeleteBtn.addEventListener('click', handleDeleteSelected);
  }
  
  // Keep legacy button references for compatibility
  const extendBtn = document.getElementById('extend-selected-btn');
  const deleteBtn = document.getElementById('delete-selected-btn');
  
  if (extendBtn) {
    extendBtn.addEventListener('click', handleExtendSelected);
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleDeleteSelected);
  }
  
  updateBatchActions();
}

// Update batch actions visibility and count
function updateBatchActions() {
  const myPagesBatchActions = document.getElementById('my-pages-batch-actions');
  const myPagesSelectionCount = document.getElementById('my-pages-selection-count');
  const sentPagesBatchActions = document.getElementById('sent-pages-batch-actions');
  const sentPagesSelectionCount = document.getElementById('sent-pages-selection-count');
  
  // Legacy batch actions (for backwards compatibility)
  const batchActions = document.getElementById('batch-actions');
  const selectionCount = document.getElementById('selection-count');
  
  const count = selectedBlobs.size;
  
  // Update all batch action sections
  if (myPagesBatchActions && myPagesSelectionCount) {
    if (count > 0) {
      myPagesBatchActions.classList.remove('hidden');
      myPagesSelectionCount.textContent = `${count} blob${count > 1 ? 's' : ''} selected`;
    } else {
      myPagesBatchActions.classList.add('hidden');
    }
  }
  
  if (sentPagesBatchActions && sentPagesSelectionCount) {
    if (count > 0) {
      sentPagesBatchActions.classList.remove('hidden');
      sentPagesSelectionCount.textContent = `${count} blob${count > 1 ? 's' : ''} selected`;
    } else {
      sentPagesBatchActions.classList.add('hidden');
    }
  }
  
  // Legacy support
  if (batchActions && selectionCount) {
    if (count > 0) {
      batchActions.classList.remove('hidden');
      selectionCount.textContent = `${count} blob${count > 1 ? 's' : ''} selected`;
    } else {
      batchActions.classList.add('hidden');
    }
  }
}

// Handle extending selected blobs
async function handleExtendSelected() {
  if (selectedBlobs.size === 0) {
    showError('No blobs selected');
    return;
  }
  
  const blobIds = Array.from(selectedBlobs);
  const blobObjects = currentBlobs.filter(blob => blobIds.includes(blob.objectId));
  
  const confirmed = confirm(`Extend ${blobObjects.length} blob(s) for 50 epochs (≈2 years)?`);
  
  if (!confirmed) return;
  
  showLoading(`Extending ${blobObjects.length} blob(s)...`);
  
  try {
    // Use 5 epochs to avoid max_epochs_ahead limit
    await extendBlobsBatch(blobObjects, 5);
    
    // Clear selection immediately
    selectedBlobs.clear();
    updateBatchActions();
    
    showSuccess(`Successfully extended ${blobObjects.length} blob(s)!`);
    
    // Wait a moment for blockchain confirmation before reloading
    setTimeout(async () => {
      await loadUserPages();
    }, 2000);
  } catch (error) {
    console.error('Error extending blobs:', error);
    showError(`Failed to extend blobs: ${error.message}`);
  }
}

// Handle deleting selected blobs
async function handleDeleteSelected() {
  if (selectedBlobs.size === 0) {
    showError('No blobs selected');
    return;
  }
  
  const blobIds = Array.from(selectedBlobs);
  const blobObjects = currentBlobs.filter(blob => blobIds.includes(blob.objectId));
  
  const confirmed = confirm(
    `⚠️ WARNING: Delete ${blobObjects.length} blob(s) permanently?\n\n` +
    `This action cannot be undone.`
  );
  
  if (!confirmed) return;
  
  showLoading(`Deleting ${blobObjects.length} blob(s)...`);
  
  try {
    await deleteBlobsBatch(blobObjects);
    
    // Clear selection immediately
    selectedBlobs.clear();
    updateBatchActions();
    
    showSuccess(`Successfully deleted ${blobObjects.length} blob(s)!`);
    
    // Wait a moment for blockchain confirmation before reloading
    setTimeout(async () => {
      await loadUserPages();
    }, 2000);
  } catch (error) {
    console.error('Error deleting blobs:', error);
    showError(`Failed to delete blobs: ${error.message}`);
  }
}

// Copy page link to clipboard
async function copyPageLink() {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    showSuccess('Link copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy link:', error);
    showError('Failed to copy link');
  }
}

// Open tip modal
function openTipModal() {
  if (!currentPageOwner) {
    showError('Owner information not available');
    return;
  }
  
  // Update owner link in tip modal
  const tipOwnerInfo = document.getElementById('tip-owner-info');
  const tipOwnerExplorerLink = document.getElementById('tip-owner-explorer-link');
  if (tipOwnerInfo && tipOwnerExplorerLink) {
    const shortAddress = `${currentPageOwner.slice(0, 6)}...${currentPageOwner.slice(-4)}`;
    tipOwnerExplorerLink.textContent = shortAddress;
    tipOwnerExplorerLink.href = `https://suivision.xyz/account/${currentPageOwner}`;
    tipOwnerExplorerLink.title = currentPageOwner;
    tipOwnerInfo.style.display = 'flex';
  }
  
  const modal = document.getElementById('tip-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

// Close tip modal
function closeTipModal() {
  const modal = document.getElementById('tip-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Send tip to page owner
async function sendTip(amount) {
  if (!currentPageOwner) {
    showError('Owner information not available');
    return;
  }
  
  if (!isWalletConnected()) {
    showError('Please connect your wallet to send a tip');
    try {
      await handleWalletConnect();
      if (!isWalletConnected()) {
        return;
      }
    } catch (error) {
      return;
    }
  }
  
  showLoading(`Sending ${amount} WAL tip...`);
  closeTipModal();
  
  try {
    const { SuiClient } = await import('@mysten/sui/client');
    const { Transaction } = await import('@mysten/sui/transactions');
    const { getWallet, getAccount, signAndExecuteTransaction } = await import('./utils/wallet.js');
    const { getSuiRpcUrl } = await import('./utils/settings.js');
    
    const wallet = getWallet();
    const account = getAccount();
    const suiRpcUrl = getSuiRpcUrl();
    const client = new SuiClient({ url: suiRpcUrl });
    
    // Get WAL coins
    const walCoins = await client.getCoins({
      owner: account.address,
      coinType: WAL_COIN_TYPE,
    });
    
    if (!walCoins.data || walCoins.data.length === 0) {
      throw new Error('No WAL coins found in wallet');
    }
    
    // Amount in MIST (1 WAL = 1,000,000,000 MIST)
    const amountInMist = amount * 1_000_000_000;
    
    // Select only enough coins to cover the tip
    let coinsToUse = [];
    let totalBalance = 0;
    
    for (const coin of walCoins.data) {
      coinsToUse.push(coin);
      totalBalance += parseInt(coin.balance);
      if (totalBalance >= amountInMist) {
        break;
      }
    }
    
    if (totalBalance < amountInMist) {
      throw new Error(`Insufficient WAL balance. Need ${amount} WAL, but only have ${totalBalance / 1_000_000_000} WAL`);
    }
    
    console.log(`Using ${coinsToUse.length} of ${walCoins.data.length} WAL coins for tip`);
    
    // Create transaction
    const tx = new Transaction();
    tx.setGasBudget(100_000_000); // 0.1 SUI
    
    // Merge only the selected coins if needed
    const [primaryCoin, ...otherCoins] = coinsToUse.map(c => c.coinObjectId);
    let walCoinRef = tx.object(primaryCoin);
    
    if (otherCoins.length > 0) {
      tx.mergeCoins(walCoinRef, otherCoins.map(id => tx.object(id)));
    }
    
    // Split the tip amount
    const tipCoin = tx.splitCoins(walCoinRef, [tx.pure.u64(amountInMist)]);
    
    // Transfer to owner
    tx.transferObjects([tipCoin], tx.pure.address(currentPageOwner));
    
    // Execute transaction
    await signAndExecuteTransaction(tx);
    
    showSuccess(`Tip of ${amount} WAL sent successfully! 🎉`);
  } catch (error) {
    console.error('Tip error:', error);
    showError(`Failed to send tip: ${error.message}`);
  }
}

// Extend blob storage
async function extendBlob() {
  if (!currentPageObjectId || !currentPageMetadata) {
    showError('No page loaded or metadata unavailable');
    return;
  }
  
  if (!isWalletConnected()) {
    showError('Please connect your wallet to extend storage');
    try {
      await handleWalletConnect();
      if (!isWalletConnected()) {
        return;
      }
    } catch (error) {
      return;
    }
  }
  
  showLoading('Calculating safe extension...');
  
  try {
    const { WalrusClient } = await import('@mysten/walrus');
    const { getSuiRpcUrl } = await import('./utils/settings.js');
    
    const suiRpcUrl = getSuiRpcUrl();
    const walrusClient = new WalrusClient({
      network: 'mainnet',
      suiRpcUrl: suiRpcUrl,
    });
    
    // Get current epoch
    const systemState = await walrusClient.systemState();
    const currentEpoch = systemState.committee.epoch;
    const maxEpochsAheadOffset = 52;
    
    // Calculate current offset
    const startOffset = currentPageMetadata.expiryEpoch - currentEpoch;
    
    // Calculate maximum safe extension
    const maxSafeExtend = maxEpochsAheadOffset - startOffset;
    
    if (maxSafeExtend <= 0) {
      throw new Error(`Blob is already at max extension limit (expires at epoch ${currentPageMetadata.expiryEpoch}, offset: ${startOffset}/${maxEpochsAheadOffset})`);
    }
    
    // Use the safe extension amount (up to 50 epochs or whatever is safe)
    const requestedEpochs = 50;
    const safeEpochs = Math.min(requestedEpochs, maxSafeExtend);
    
    console.log(`Extending by ${safeEpochs} epochs (requested: ${requestedEpochs}, max safe: ${maxSafeExtend})`);
    
    // Create blob object for batch extension
    const blobObject = {
      objectId: currentPageObjectId,
      expiryEpoch: currentPageMetadata.expiryEpoch,
    };
    
    showLoading(`Extending storage by ${safeEpochs} epochs...`);
    
    // Use the batch extension function with a single blob
    await extendBlobsBatch([blobObject], safeEpochs);
    
    // Refresh metadata display
    const metadata = await getMetadata(currentPageObjectId);
    currentPageMetadata = metadata;
    
    const expiryEl = document.getElementById('expiry-time');
    if (expiryEl && metadata.expiryEpoch) {
      expiryEl.textContent = `Epoch ${metadata.expiryEpoch}`;
    }
    
    showSuccess(`Storage extended by ${safeEpochs} epochs! New expiry: ${metadata.expiryEpoch}`);
  } catch (error) {
    console.error('Extension error:', error);
    showError(`Failed to extend storage: ${error.message}`);
  }
}

// Start the app
init();
