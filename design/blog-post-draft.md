# Walrus Pages: Write Freely. Own Completely.

Traditional publishing platforms own your content and audience. You're building on someone else's land, subject to their rules, their algorithms, their terms of service. Walrus Pages flips this model entirely.

When you publish through Walrus Pages, you connect your wallet, write in Markdown, and publish—your content is stored across a distributed network with cryptographic proof that you own it. No centralized operator controls it. No middlemen take cuts from your tips. Your content remains accessible as long as you fund its storage.

Your publications are stored on [Walrus](https://docs.wal.app), a decentralized blob storage network, and represented as objects on the [Sui blockchain](https://sui.io). Only your wallet's private key can extend or delete them. No centralized operator can unilaterally delete your content. Your wallet's private key is the authority for your publications.

## Publishing Without Intermediaries

The publishing process is straightforward: connect with any [Sui wallet](https://sui.io/get-started), compose your content in Markdown with live preview, and hit publish. Your content gets a permanent link that anyone can access, no wallet required for readers. Built-in tipping lets readers send WAL tokens directly to your wallet—no platform fees, no payment processors taking their cut. Every WAL token sent goes directly to you, and all transactions are transparent on the blockchain.

Behind the scenes, your content is split into shards using erasure coding and distributed across independent Walrus storage nodes. Multiple nodes hold redundant copies, ensuring availability even if some go offline. Each publication becomes an object on the Sui blockchain that tracks your ownership, the blob ID where content is stored, and the expiry epoch. Aggregator nodes reconstruct and serve your content to readers over standard HTTP.

Storage is purchased in two-week epochs with explicit, predictable costs. No surprise price changes or policy updates. You can extend storage anytime by purchasing more epochs, or delete content early to reclaim unused funds. Your dashboard shows all publications with their expiry epochs, letting you manage storage for individual pages or in batches.

## Built on Open Infrastructure

Content isn't locked to any specific interface. It's accessible through any Walrus aggregator using open protocols. Your metadata lives on the public Sui blockchain. You can build alternative interfaces, export to other formats, or integrate with other tools. The content and ownership record exist independently on decentralized infrastructure, geographically distributed across independent nodes with erasure coding redundancy.

This architecture eliminates single points of failure. Sites don't go down because one company's servers failed. There's no central database that can be compromised, no single entity that decides whose content stays up.

[Walrus](https://docs.wal.app) provides decentralized blob storage with erasure coding, economic incentives for storage nodes, and an aggregator network for retrieval. [Sui](https://sui.io) provides fast, low-cost transactions with an object-based model perfect for representing content—your publications are objects with dynamic fields for metadata, programmable with Move smart contracts. Connect with [Sui Wallet, Suiet, Slush, or any compatible wallet](https://sui.io/get-started), signing transactions with your private keys. No passwords, no email registration.

Together, these create a publishing system that's open, transparent, and owned by users rather than platforms.

## Getting Started

To start publishing, you'll need a [Sui wallet browser extension](https://sui.io/get-started) and small amounts of SUI for transaction fees and WAL for storage. Once you have those, connect your wallet, write your first piece in Markdown, and publish. Your content is immediately available at a permanent link that anyone can read without needing a wallet of their own.

---

*Built on [Walrus](https://docs.wal.app) decentralized storage and the [Sui](https://sui.io) blockchain. This web app itself is hosted on Walrus using [Walrus Sites](https://docs.wal.app/walrus-sites/intro.html)—demonstrating the decentralized hosting technology it's built on.*
