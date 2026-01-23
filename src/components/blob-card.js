/**
 * Blob Card Component
 * Reusable component for rendering blob cards in user pages and admin views
 */

/**
 * Formats bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatBlobSize(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

/**
 * Checks if a blob is expired
 * @param {number} expiryEpoch - The blob's expiry epoch
 * @param {number} currentEpoch - The current epoch
 * @returns {boolean} True if expired
 */
export function isBlobExpired(expiryEpoch, currentEpoch) {
  return expiryEpoch < currentEpoch;
}

/**
 * Checks if a blob is uncertified
 * @param {Object} blob - The blob object
 * @returns {boolean} True if uncertified
 */
export function isBlobUncertified(blob) {
  return !blob.certifiedEpoch;
}

/**
 * Calculates epochs remaining until expiry
 * @param {number} expiryEpoch - The blob's expiry epoch
 * @param {number} currentEpoch - The current epoch
 * @returns {number} Epochs remaining (0 if expired)
 */
export function calculateEpochsRemaining(expiryEpoch, currentEpoch) {
  return Math.max(0, expiryEpoch - currentEpoch);
}

/**
 * Creates a blob card element for user pages (simple view)
 * @param {Object} blob - Blob object with metadata
 * @param {Object} options - Configuration options
 * @param {boolean} options.showCheckbox - Whether to show selection checkbox
 * @param {boolean} options.isSelected - Whether the blob is currently selected
 * @returns {string} HTML string for the blob card
 */
export function createUserPageCard(blob, options = {}) {
  const { showCheckbox = false, isSelected = false } = options;
  
  const checkboxHtml = showCheckbox 
    ? `<input type="checkbox" class="blob-checkbox" data-blob-id="${blob.objectId}" ${isSelected ? 'checked' : ''} />` 
    : '';
  
  return `
    <div class="page-card">
      <div class="page-card-header">
        ${checkboxHtml}
        <h3>${blob.title || 'Untitled'}</h3>
        <span class="expiry-epoch">Epoch ${blob.expiryEpoch || 'N/A'}</span>
      </div>
      <div class="page-actions">
        <button class="btn-primary btn-small" onclick="window.location.href='?page=${blob.objectId}'">View</button>
      </div>
    </div>
  `;
}

/**
 * Creates a blob card element for admin panel (detailed view)
 * @param {Object} blob - Blob object with metadata
 * @param {number} currentEpoch - Current blockchain epoch
 * @param {Set} selectedBlobs - Set of selected blob IDs
 * @returns {HTMLElement} DOM element for the blob card
 */
export function createAdminBlobCard(blob, currentEpoch, selectedBlobs) {
  const card = document.createElement('div');
  card.className = 'blob-card';
  card.dataset.blobId = blob.objectId;
  
  const isExpired = isBlobExpired(blob.expiryEpoch, currentEpoch);
  const isUncertified = isBlobUncertified(blob);
  const isSelected = selectedBlobs.has(blob.objectId);
  
  if (isSelected) {
    card.classList.add('selected');
  }
  
  const epochsAgo = currentEpoch - blob.expiryEpoch;
  
  let statusBadge = '';
  if (isUncertified && !isExpired) {
    statusBadge = '<span class="badge warning-badge">⚠️ Not Certified</span>';
  } else if (isExpired) {
    statusBadge = `<span class="value expired-badge">${epochsAgo} epoch${epochsAgo !== 1 ? 's' : ''} ago</span>`;
  }
  
  card.innerHTML = `
    <div class="blob-header">
      <input type="checkbox" 
        class="blob-checkbox" 
        data-blob-id="${blob.objectId}"
        ${isSelected ? 'checked' : ''}>
      <div class="blob-title">${blob.name || 'Untitled'}</div>
      ${statusBadge}
    </div>
    <div class="blob-meta">
      <div class="blob-meta-item">
        <span class="label">Blob ID:</span>
        <span class="value">${blob.blobId.slice(0, 10)}...</span>
      </div>
      <div class="blob-meta-item">
        <span class="label">${isExpired ? 'Expired:' : 'Certified Epoch:'}</span>
        ${isExpired ? `<span class="value expired-badge">${epochsAgo} epoch${epochsAgo !== 1 ? 's' : ''} ago</span>` : `<span class="value">${blob.certifiedEpoch || 'None'}</span>`}
      </div>
      <div class="blob-meta-item">
        <span class="label">Size:</span>
        <span class="value">${formatBlobSize(blob.size)}</span>
      </div>
      <div class="blob-meta-item">
        <span class="label">Expiry Epoch:</span>
        <span class="value">${blob.expiryEpoch}</span>
      </div>
    </div>
    <div class="blob-actions">
      <button class="btn btn-sm btn-danger burn-single" data-blob-id="${blob.objectId}">
        🔥 Burn
      </button>
    </div>
  `;
  
  return card;
}

/**
 * Attaches event handlers to an admin blob card
 * @param {HTMLElement} card - The card element
 * @param {Object} blob - The blob object
 * @param {Set} selectedBlobs - Set of selected blob IDs
 * @param {Function} onSelectionChange - Callback when selection changes
 * @param {Function} onBurnSingle - Callback when burn button clicked
 */
export function attachAdminCardHandlers(card, blob, selectedBlobs, onSelectionChange, onBurnSingle) {
  // Checkbox handler
  const checkbox = card.querySelector('.blob-checkbox');
  if (checkbox) {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedBlobs.add(blob.objectId);
        card.classList.add('selected');
      } else {
        selectedBlobs.delete(blob.objectId);
        card.classList.remove('selected');
      }
      onSelectionChange();
    });
  }
  
  // Single burn handler
  const burnBtn = card.querySelector('.burn-single');
  if (burnBtn) {
    burnBtn.addEventListener('click', () => onBurnSingle(blob));
  }
}
