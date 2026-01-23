/**
 * Router Module - Handles URL parameter parsing and view navigation
 */

import { getAggregatorUrl } from './settings.js';

export function getPageId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('page');
}

export function getAddress() {
  const params = new URLSearchParams(window.location.search);
  return params.get('address');
}

export function detectAggregator() {
  // Use user-configured aggregator or default
  return getAggregatorUrl();
}

export function navigateToPage(objectId) {
  const baseUrl = window.location.pathname + window.location.search;
  window.location.href = `${window.location.origin}${window.location.pathname}?page=${objectId}`;
}

export function showView(viewId) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.add('hidden');
  });
  
  // Show selected view
  const view = document.getElementById(viewId);
  if (view) {
    view.classList.remove('hidden');
  }
}
