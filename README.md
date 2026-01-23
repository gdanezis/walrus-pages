# Walrus Pages

A decentralized publishing platform that allows anyone to create, store, and view Markdown content on [Walrus](https://docs.wal.app) decentralized storage, authenticated through [Sui](https://sui.io) wallets.

## What is Walrus Pages?

Walrus Pages is a single-page web application that enables:

- **Decentralized Publishing**: Write and publish Markdown content stored on Walrus, a decentralized blob storage network
- **Wallet-Based Ownership**: Content is owned by your Sui wallet address with cryptographic proof
- **No Backend Required**: Direct interaction with Walrus storage and Sui blockchain
- **Direct Reader Tipping**: Readers can tip content creators directly in WAL tokens
- **Permissionless Reading**: Anyone can view published pages without needing a wallet

The application itself is deployed as a Walrus Site, demonstrating the technology it's built on.

## Features

### For Readers
- 📖 Browse published pages without wallet connection
- 👥 View all pages by any address
- 💰 Tip content creators directly in WAL tokens
- 🔗 Share permanent links to content

### For Publishers
- ✍️ WYSIWYG Markdown editor with live preview
- 📝 Add titles to your publications
- 📅 Extend storage duration for published content
- 📊 Dashboard showing all your publications
- 🗑️ Batch operations for managing multiple pages
- ⚙️ Custom network configuration

## Getting Started

### For Users

1. Visit the live site at `http://[site-url].walrus.site`
2. Browse existing pages or click "Browse Address" to view any publisher's content
3. To publish your own content:
   - Install a [Sui wallet](https://sui.io/get-started) (Sui Wallet, Suiet, or compatible)
   - Get small amounts of SUI (for gas) and WAL (for storage)
   - Click "Create Page" and connect your wallet
   - Write your content and publish

### For Developers

#### Prerequisites

- Node.js 18+ and npm
- A Sui wallet for publishing (if testing publication features)

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/walrus-pages.git
cd walrus-pages

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

#### Building for Production

```bash
npm run build
```

This creates optimized HTML files in the `dist/` directory, bundled as single files with all dependencies inlined.

#### Deploying to Walrus Sites

See [WALRUS_SITE_DEPLOYMENT.md](WALRUS_SITE_DEPLOYMENT.md) for detailed deployment instructions.

## Architecture

- **Frontend**: Single-page application built with Vite
- **Storage**: Walrus decentralized blob storage for content
- **Blockchain**: Sui for transactions, payments, and metadata
- **Wallet**: Sui Wallet Standard for authentication

No traditional backend servers are used. All data interactions go directly to Walrus and Sui.

## Technical Details

### Storage Model

- Pages are stored as Markdown blobs on Walrus
- Blob metadata (owner, title, expiry) is tracked on Sui blockchain
- Storage is purchased in epochs (~2 weeks per epoch)
- Content is distributed using erasure coding across storage nodes

### Key Files

- `src/main.js` - Main application logic and routing
- `src/utils/wallet.js` - Sui wallet integration
- `src/utils/walrus.js` - Walrus blob operations
- `src/utils/upload.js` - Publishing and storage management
- `src/config/constants.js` - Network configuration

## Documentation

- [Deployment Guide](WALRUS_SITE_DEPLOYMENT.md) - How to deploy to Walrus Sites
- [Installation Status](INSTALLATION_STATUS.md) - Setup and configuration
- [Design Docs](design/) - Technical specifications and implementation notes

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

[MIT License](LICENSE) (or specify your license)

## Learn More

- [Walrus Documentation](https://docs.wal.app)
- [Sui Documentation](https://docs.sui.io)
- [Walrus Sites Tutorial](https://docs.wal.app/walrus-sites/intro.html)

---

**Built on decentralized infrastructure:** This application is hosted entirely on Walrus Sites, with content stored on Walrus and ownership tracked on Sui.
