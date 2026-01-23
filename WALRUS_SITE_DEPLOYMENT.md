# Deploying to Walrus Sites

This guide explains how to deploy your Walrus Pages application as a Walrus Site - a fully decentralized website hosted entirely on Walrus storage.

## What is a Walrus Site?

A **Walrus Site** is a website where:
- All HTML, CSS, and JavaScript files are stored as blobs on Walrus
- A site manifest maps URLs to blob IDs  
- Walrus aggregators serve the site via HTTP
- No traditional web hosting required (no AWS, Vercel, Netlify)

## Installation

### 1. Install Site Builder

```bash
# For Apple Silicon Macs
curl -L https://storage.googleapis.com/mysten-walrus-binaries/site-builder-mainnet-latest-macos-arm64 -o site-builder

# For Intel Macs:
# curl -L https://storage.googleapis.com/mysten-walrus-binaries/site-builder-mainnet-latest-macos-x86_64 -o site-builder

chmod +x site-builder
sudo mkdir -p /usr/local/bin
sudo mv site-builder /usr/local/bin/

# Verify installation
site-builder --version
```

### 2. Install Walrus CLI

```bash
# For Apple Silicon Macs
curl -L https://storage.googleapis.com/mysten-walrus-binaries/walrus-mainnet-latest-macos-arm64 -o walrus

# For Intel Macs:
# curl -L https://storage.googleapis.com/mysten-walrus-binaries/walrus-mainnet-latest-macos-x86_64 -o walrus

chmod +x walrus
sudo mv walrus /usr/local/bin/

# Verify
walrus --version
```

### 3. Configure Site Builder

```bash
# Create config directory
mkdir -p ~/.config/walrus

# Download mainnet configuration
curl https://raw.githubusercontent.com/MystenLabs/walrus-sites/refs/heads/mainnet/sites-config.yaml -o ~/.config/walrus/sites-config.yaml

# If you have a single-context walrus config, comment out walrus_context:
sed -i.bak 's/walrus_context: mainnet/# walrus_context: mainnet/' ~/.config/walrus/sites-config.yaml
```

### 4. Check Your Balances

```bash
sui client balance
```

You need:
- **SUI**: ~0.01-0.05 per transaction (for gas)
- **WAL**: ~0.5-1 WAL per MB for 50 epochs (for storage)

## Publishing Your Site

### Build

```bash
npm run build
```

### Publish

```bash
cd /path/to/walrus-pages
site-builder publish --epochs 50 dist/
```

> **Important**: Maximum is 53 epochs ahead. The command will fail if you request more.

### Success Output

```
Parsing the directory dist/ ... [Ok]
Computing Quilt IDs and storing Quilts ... [Ok]
Applying the Walrus Site object updates on Sui ... [Ok]

Created new site! 
New site object ID: 0x5d2d664b19637ae6e907bd3161519fbd95ad07c0671008e24f9c620e6f203781

To browse your site:
http://2blrbj0mnehcwya1gu5lb85r17abotbimw1id2oivd0tqjw0w1.walrus.site
```

## Accessing Your Site

Your site is live at `http://<subdomain>.walrus.site` where the subdomain is derived from your site object ID.

Example: `http://2blrbj0mnehcwya1gu5lb85r17abotbimw1id2oivd0tqjw0w1.walrus.site`

> Note: Currently uses `http://` not `https://`

## Updating Your Site

```bash
# Build updates
npm run build

# Update (reads object ID from dist/ws-resources.json)
site-builder update --epochs 50 dist/
```

## Troubleshooting

### "cannot specify context when using single-context configuration"

```bash
sed -i.bak 's/walrus_context: mainnet/# walrus_context: mainnet/' ~/.config/walrus/sites-config.yaml
```

### "blobs can only be stored for up to 53 epochs ahead"

```bash
# Use 50 or less
site-builder publish --epochs 50 dist/
```

### "Insufficient WAL balance"

```bash
sui client balance
# You need ~0.5-1 WAL for 50 epochs per MB
```

## Costs

- **Your 1.14 MB site for 50 epochs**: ~0.57 WAL + ~0.02 SUI gas
- **Storage rate**: ~0.01 WAL per MB per epoch
- **Max epochs ahead**: 53 epochs (~53 days)

## Quick Reference

```bash
# Build
npm run build

# Publish new site
site-builder publish --epochs 50 dist/

# Update existing site  
site-builder update --epochs 50 dist/

# Check balances
sui client balance

# View site structure
site-builder sitemap 0xYOUR_SITE_OBJECT_ID
```

## Learn More

- [Walrus Sites Docs](https://docs.wal.app/docs/walrus-sites/tutorial-install)
- [Walrus Sites GitHub](https://github.com/MystenLabs/walrus-sites)
- [Discord Community](https://discord.gg/walrusprotocol)

---

**Your app is now live on fully decentralized Walrus Sites! 🦭**
