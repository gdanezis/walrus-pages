# Walrus Pages - Deployment Guide

This guide covers building, uploading, and testing the Walrus Pages application.

## Prerequisites

- Walrus CLI installed at `~/walrus-mainnet-latest-macos-arm64`
- Sui wallet configured with SUI and WAL tokens
- Node.js and npm installed
- All dependencies installed (`npm install` in this directory)

## Build the Application

1. **Build the single-file HTML bundle:**
   ```bash
   npm run build
   ```
   This creates `dist/index.html` - a single self-contained HTML file with all JavaScript and CSS inlined.

2. **Verify the build output:**
   ```bash
   ls -lh dist/index.html
   ```

## Upload to Walrus

### Store the HTML file

Upload the built application to Walrus mainnet:

```bash
~/walrus-mainnet-latest-macos-arm64 store dist/index.html --epochs 50
```

**Expected output:**
```
Success: Permanent blob stored successfully.
Blob ID: <blob-id>
Sui object ID: <object-id>
Cost: <amount> WAL
Expiry epoch: <epoch-number>
```

**Save both IDs:**
- **Blob ID**: Used to access via blob ID endpoint
- **Object ID**: Required for setting attributes and metadata

### Set Content-Type Attribute

After uploading, set the content-type attribute so the app renders as HTML:

```bash
~/walrus-mainnet-latest-macos-arm64 set-blob-attribute <OBJECT_ID> --attr "content-type" "text/html"
```

Replace `<OBJECT_ID>` with the Sui object ID from the upload step.

**Verify the attribute was set:**
```bash
~/walrus-mainnet-latest-macos-arm64 get-blob-attribute <OBJECT_ID>
```

Should show:
```
Attribute
content-type: text/html
```

## Run Local Aggregator

Public aggregators don't properly serve the content-type header due to configuration issues. For development and testing, run a local aggregator:

### Start the aggregator in background:

```bash
~/walrus-mainnet-latest-macos-arm64 aggregator --bind-address 127.0.0.1:31415 > /tmp/walrus-aggregator.log 2>&1 &
```

**Check it's running:**
```bash
ps aux | grep walrus-mainnet | grep -v grep
```

### Stop the aggregator when done:

```bash
pkill -f "walrus-mainnet.*aggregator"
```

## Access the Application

### Via Local Aggregator (Development):

```
http://127.0.0.1:31415/v1/blobs/by-object-id/<OBJECT_ID>
```

**Why use object ID endpoint?**
- Supports content-type and other attributes
- Proper HTML rendering with correct headers

### Via Public Aggregators (Production):

```
https://aggregator.walrus-mainnet.walrus.space/v1/blobs/by-object-id/<OBJECT_ID>
```

**Note:** Public aggregators currently don't serve the content-type attribute, but browsers will still render HTML through content sniffing.

### Direct Blob ID Access:

```
http://127.0.0.1:31415/v1/blobs/<BLOB_ID>
```

**Limitation:** Blob ID endpoint doesn't support attributes, always returns `application/octet-stream`.

## URL Pattern for Pages

When the app is deployed, users access specific pages using the query parameter pattern:

```
http://127.0.0.1:31415/v1/blobs/by-object-id/<APP_OBJECT_ID>?page=<CONTENT_OBJECT_ID>
```

- `<APP_OBJECT_ID>`: The Walrus Pages app itself
- `<CONTENT_OBJECT_ID>`: The markdown content blob to display

## Testing Checklist

- [ ] Build completes successfully
- [ ] Upload to Walrus succeeds (save both IDs)
- [ ] Content-type attribute set on object
- [ ] Local aggregator running
- [ ] App loads at local aggregator URL
- [ ] App displays HTML correctly with proper content-type header
- [ ] Can view page with test markdown content

## Updating the Application

To deploy a new version:

1. Make changes to source code
2. Build: `npm run build`
3. Upload new version: `~/walrus-mainnet-latest-macos-arm64 store dist/index.html --epochs 50`
4. Set attribute on new object: `~/walrus-mainnet-latest-macos-arm64 set-blob-attribute <NEW_OBJECT_ID> --attr "content-type" "text/html"`
5. Share new object ID URL

**Note:** Old versions remain available at their original URLs until expiry.

## Cost Considerations

- **Storage cost**: ~0.036 WAL per 1KB per 50 epochs (example from test upload)
- **50 epochs**: Approximately 2 years of storage
- **Gas costs**: Small amount of SUI for Sui blockchain transactions
- **No read costs**: Fetching data from aggregators is free

## Troubleshooting

### Aggregator returns 404:
- Verify blob/object ID is correct
- Check aggregator is running: `curl -I http://127.0.0.1:31415/v1/blobs/<BLOB_ID>`
- Ensure using `/v1/blobs/` path prefix

### Wrong content-type:
- Use `/v1/blobs/by-object-id/<OBJECT_ID>` endpoint (not blob ID)
- Verify attribute is set: `get-blob-attribute <OBJECT_ID>`
- Check local aggregator is running (not using public aggregator)

### Aggregator won't start:
- Check if port 31415 is in use: `lsof -i :31415`
- Kill existing process: `pkill -f walrus-mainnet.*aggregator`
- Check logs: `tail -f /tmp/walrus-aggregator.log`

### Blob expired:
- Check status: `~/walrus-mainnet-latest-macos-arm64 blob-status --object-id <OBJECT_ID>`
- Extend lifetime: `~/walrus-mainnet-latest-macos-arm64 extend --blob-obj-id <OBJECT_ID> --epochs 50`

## Production Deployment Considerations

For production use beyond local development:

1. **Option A: Run your own aggregator**
   - Host on VPS/cloud with public IP
   - Configure with proper allowed headers
   - Set up HTTPS with SSL certificate
   - Consider caching/CDN in front

2. **Option B: Accept public aggregator limitations**
   - Browsers handle HTML rendering despite wrong content-type
   - Document the limitation for users
   - Monitor if public aggregators update configurations

3. **Option C: Wait for ecosystem improvements**
   - Public aggregators may update configurations
   - New operators may launch with proper settings
   - CLI/SDK improvements may emerge

## References

- [Walrus CLI Documentation](https://docs.wal.app/docs/usage/client-cli)
- [Walrus HTTP API](https://docs.wal.app/docs/usage/web-api)
- [Operating an Aggregator](https://docs.wal.app/docs/operator-guide/aggregator)
- [Blob Attributes](https://docs.wal.app/docs/usage/client-cli#manage-blob-attributes)
