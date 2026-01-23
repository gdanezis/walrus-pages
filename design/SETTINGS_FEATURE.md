# Settings Feature - Custom Aggregator & Upload Relay

## Overview

Users can now configure custom aggregator and upload relay URLs instead of using the hardcoded defaults. This provides flexibility for:

- Using alternative or regional Walrus aggregators
- Testing with local or development nodes
- Load balancing across different endpoints
- Using private/custom infrastructure

## User Interface

### Settings Button
- A new **⚙️ Settings** button has been added to the navbar
- Click to open the settings modal

### Settings Modal
The modal contains:
1. **Aggregator URL** field - Endpoint for reading blobs
2. **Upload Relay URL** field - Endpoint for uploading blobs
3. **Current Settings** display - Shows currently active URLs
4. **Reset to Defaults** button - Restores default Mysten Labs endpoints
5. **Save Settings** button - Saves custom configuration

## Default Values

- **Aggregator**: `https://aggregator.walrus-mainnet.walrus.space`
- **Upload Relay**: `https://upload-relay.mainnet.walrus.space`

## How It Works

### Storage
- Settings are saved in browser's `localStorage` under the key `walrus_settings`
- Settings persist across browser sessions
- Each browser/device has independent settings

### Validation
- URLs must start with `http://` or `https://`
- Invalid URLs will show an error notification
- Empty fields default to standard endpoints

### Application
- The aggregator URL is used when fetching blob content
- The upload relay URL is used when uploading new blobs
- Settings are read on every operation (no app restart needed)

## Technical Implementation

### New Files Created

1. **`src/utils/settings.js`**
   - Core settings management functions
   - localStorage persistence
   - URL validation
   - Default values

2. **`src/components/settings-modal.js`**
   - Settings UI controller
   - Modal open/close logic
   - Form validation and submission
   - Display of current settings

### Modified Files

1. **`src/utils/router.js`**
   ```javascript
   // Before
   export function detectAggregator() {
     return 'https://aggregator.walrus-mainnet.walrus.space';
   }
   
   // After
   export function detectAggregator() {
     return getAggregatorUrl(); // Uses user setting or default
   }
   ```

2. **`src/services/walrus-upload.js`**
   ```javascript
   // Before
   uploadRelay: {
     host: 'https://upload-relay.mainnet.walrus.space',
   }
   
   // After
   const uploadRelayUrl = getUploadRelayUrl();
   uploadRelay: {
     host: uploadRelayUrl, // Uses user setting or default
   }
   ```

3. **`index.html`**
   - Added Settings button to navbar
   - Added Settings modal HTML structure

4. **`src/main.js`**
   - Initialize settings modal on app load

5. **`src/styles/main.css`**
   - Added styles for settings modal
   - Input field styles for URL inputs
   - Current settings display styles

## Usage Examples

### Using a Custom Aggregator

1. Click **⚙️ Settings** in the navbar
2. Enter custom aggregator URL: `https://my-aggregator.example.com`
3. Leave upload relay as default (or customize it too)
4. Click **Save Settings**
5. All blob fetches now use your custom aggregator

### Testing with Local Development Node

1. Open Settings
2. Set Aggregator: `http://localhost:8080`
3. Set Upload Relay: `http://localhost:8081`
4. Save Settings
5. App now uses local development infrastructure

### Resetting to Defaults

1. Open Settings
2. Click **Reset to Defaults**
3. Confirm the action
4. Default Mysten Labs endpoints are restored

## API Reference

### Settings Module (`src/utils/settings.js`)

```javascript
import { 
  getSettings,
  saveSettings,
  resetSettings,
  getAggregatorUrl,
  getUploadRelayUrl,
  isValidUrl,
  getDefaults 
} from './utils/settings.js';

// Get all settings
const settings = getSettings();
// Returns: { aggregator: string, uploadRelay: string }

// Save settings
saveSettings({
  aggregator: 'https://custom-aggregator.com',
  uploadRelay: 'https://custom-relay.com'
});

// Reset to defaults
resetSettings();

// Get individual URLs
const aggregator = getAggregatorUrl();
const uploadRelay = getUploadRelayUrl();

// Validate URL
if (isValidUrl('https://example.com')) {
  // Valid URL
}

// Get default values
const defaults = getDefaults();
```

### Settings Modal (`src/components/settings-modal.js`)

```javascript
import { 
  initSettingsModal,
  openSettings,
  closeSettings,
  isSettingsOpen 
} from './components/settings-modal.js';

// Initialize (call once on app load)
initSettingsModal();

// Programmatically open settings
openSettings();

// Close settings
closeSettings();

// Check if open
if (isSettingsOpen()) {
  // Modal is visible
}
```

## Future Enhancements

Potential improvements for future versions:

1. **Aggregator Health Checking**
   - Ping aggregators to check response time
   - Auto-select fastest aggregator
   - Fallback to secondary aggregators on failure

2. **Predefined Aggregator List**
   - Dropdown of known aggregators
   - Regional selection (US, EU, Asia)
   - Community-maintained aggregator registry

3. **Upload Relay Selection**
   - Compare costs across different relays
   - Show relay availability status
   - Automatic relay selection based on location

4. **Settings Import/Export**
   - Export settings as JSON
   - Import settings from file
   - Share configurations across devices

5. **Advanced Options**
   - Custom timeout values
   - Retry configuration
   - Caching preferences
   - Debug logging toggle

## Troubleshooting

### Settings Not Persisting
- Check browser's localStorage is enabled
- Clear localStorage and try again: `localStorage.clear()`
- Check for browser extensions blocking localStorage

### Invalid URL Error
- Ensure URL starts with `http://` or `https://`
- Remove trailing slashes
- Check for typos in the URL

### Aggregator Not Working
- Verify the aggregator URL is correct
- Test the URL in a browser: `{aggregator}/v1/health`
- Check network connectivity
- Try resetting to defaults

### Upload Failures
- Confirm upload relay URL is correct
- Check wallet has sufficient SUI for tips
- Verify upload relay is accepting connections
- Reset to default upload relay

## Security Considerations

- Settings are stored in browser localStorage (not encrypted)
- Do not store sensitive information in custom URLs
- Custom aggregators can see which blobs you're requesting
- Custom upload relays handle your blob data
- Only use trusted aggregators and relays
- Default endpoints are maintained by Mysten Labs

## Related Documentation

- [Walrus Documentation](https://docs.walrus.site/)
- [Aggregator API Reference](https://docs.walrus.site/aggregator-api)
- [Upload Relay Protocol](https://docs.walrus.site/upload-relay)
