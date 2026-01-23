# Walrus Pages - Setup Guide

## 📋 Prerequisites

### Required System Tools
- **Node.js**: 18+ (recommended: 22+)
- **npm**: 9+ (comes with Node.js)
- **Git**: For cloning the repository

### Required Dependencies

All project dependencies are listed in `package.json` and will be installed with `npm install`:

**Core Dependencies (Production):**
- `@mysten/sui` - Sui TypeScript SDK
- `@mysten/wallet-standard` - Wallet connection
- `@mysten/walrus` - Walrus SDK
- `marked` - Markdown parser
- `easymde` - WYSIWYG Markdown editor
- `dompurify` - HTML sanitizer

**Development Dependencies:**
- `vite` - Build tool and dev server
- `vite-plugin-singlefile` - Single file HTML bundler
- `typescript` - Type safety
- `@types/*` - Type definitions
- `eslint` - Linting
- `prettier` - Code formatting

## ⚠️ Manual Setup Required

### Blockchain & Wallet
- [ ] **Sui Wallet Browser Extension** - Install from browser extension store
  - Options: Sui Wallet, Suiet Wallet, or Ethos Wallet
  - Create wallet and backup seed phrase
- [ ] **SUI Tokens (Mainnet)** - Acquire 1-5 SUI for testing
  -🚀 Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd walrus-pages
npm install
```

### 2. Blockchain & Wallet Setup

**Install Sui Wallet:**
- Install a Sui wallet browser extension from your browser's extension store
- Options: Sui Wallet (official), Suiet Wallet, or Ethos Wallet
- Create a new wallet and **securely backup your seed phrase**

**Acquire SUI Tokens:**
- You'll need 1-5 SUI for testing on mainnet
- Purchase from exchanges or receive from others
- Estimated cost: $2-10 USD
- For testing, consider creating a separate wallet

**Network Endpoints (Public):**
- Walrus Aggregator: https://aggregator.walrus.site
- Sui Mainnet RPC: https://fullnode.mainnet.sui.io:443
� Development

### Start Development Server

```bash
npm run dev
```

This starts Vite's development server with hot module replacement.

### Build for Production

```bash
npm run build
```

Builds the application into a single HTML file in the `dist/` directory.
Or use Vite's built-in dev server

## 📊 Cost Summary

### Already Spent
- $0 - All software tools are free/open source

### Required for Testing
- ~$� Estimated Costs

**Development:**
- Free - All software tools are free and open source

**Testing & Deployment:**
- ~$2-10 USD - SUI tokens for mainnet transactions
- ~$0.20-0.60 USD - Per blob storage on Walrus

**Total: $5-20 USD** for complete development, testing, and deployment

# Run development server (need to configure)
npm run dev

# Build for production (need to configure)
npm run build

# Lint code
npx eslint src/

# Format code
npx prettier --write src/

# Type check
npx tsc --noEmit
```

## 📚 Resources

- Sui SDK Docs: https://sdk.mystenlabs.com/typescript
- Walrus SDK Docs: https://docs.walrus.site
- Vite Docs: https://vite.dev
- Marked.js: https://marked.js.org
- EasyMDE: https://github.com/Ionaru/easy-markdown-editor
- DOMPurify: https://github.com/cure53/DOMPurify

## 🔍 Verification

Run these commands to verify installation:

```bash
node --version    # Should show v22.18.0
npm --version     # Should show v10.9.3
npm list --depth=0 # Should show all packages listed above
```Useful Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npx eslint src/

# Format code
npx prettier --write src/

# Type check (if using TypeScript)Documentation & Resources

- **Sui TypeScript SDK**: https://sdk.mystenlabs.com/typescript
- **Walrus Documentation**: https://docs.walrus.site
- **Vite Build Tool**: https://vite.dev
- **Marked.js** (Markdown): https://marked.js.org
- **EasyMDE** (Editor): https://github.com/Ionaru/easy-markdown-editor
- **DOMPurify** (Sanitizer): https://github.com/cure53/DOMPurify

## ✅ Verification

After installation, verify your setup:

```bash
node --version     # Should be 18+
npm --version      # Should be 9+
npm list --depth=0 # Should show all dependencies installed
```