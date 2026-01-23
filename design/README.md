# Design Documentation

This folder contains technical specifications, implementation notes, and reference materials for the Walrus Pages project.

## Current Documents

### Specifications & Architecture

- **[spec.txt](spec.txt)** - Original technical specification and architecture document. Describes the core design of the single-page application, Walrus integration, and Sui blockchain interactions.

### Implementation Documentation

- **[BATCH_OPERATIONS_IMPLEMENTATION.md](BATCH_OPERATIONS_IMPLEMENTATION.md)** - Details the batch extend and delete operations for managing multiple blobs in a single transaction. Includes PTB (Programmable Transaction Block) structure and UI implementation.

- **[SETTINGS_FEATURE.md](SETTINGS_FEATURE.md)** - Documentation for the custom aggregator and upload relay configuration feature. Explains how users can configure alternative Walrus endpoints.

- **[REFACTORING-SUMMARY.md](REFACTORING-SUMMARY.md)** - Phase 1 refactoring summary showing how the codebase was modularized and organized. Useful for understanding the current architecture.

### Learning Resources & Reference

- **[walrus-web-tutorial.md](walrus-web-tutorial.md)** (75KB) - Comprehensive tutorial on building web applications with Walrus storage. Essential reference for understanding:
  - Decentralized storage concepts
  - Walrus architecture and blob operations
  - Sui wallet integration
  - Reading/uploading/managing blobs
  - Storage economics and epochs
  - Transaction patterns
  
  **Keep this**: Critical reference material for AI-assisted development as Walrus is not yet well-known.

- **[sui-transactions-learnings.md](sui-transactions-learnings.md)** - Important learnings about Sui transaction building, debugging, and common pitfalls:
  - Package upgrades and compatibility
  - Shared object versioning (critical!)
  - Object structure inspection
  - Common transaction patterns
  
  **Keep this**: Contains hard-won knowledge about Sui-specific behaviors that aren't well documented elsewhere.

### Drafts & Marketing

- **[blog-post-draft.md](blog-post-draft.md)** - Draft marketing/announcement content explaining the value proposition of Walrus Pages. Can be used for future blog posts or documentation.

## Purpose

These documents serve multiple purposes:

1. **Historical Record** - Track design decisions and implementation evolution
2. **Onboarding** - Help new contributors understand the architecture
3. **AI Assistant Context** - Provide reference material for AI-assisted development, especially for Sui and Walrus which are emerging technologies
4. **Implementation Guide** - Document patterns and best practices discovered during development

## When to Update

- **spec.txt** - Update when core architecture changes
- **Implementation docs** - Keep as historical record; create new docs for major changes
- **Learning resources** - These are reference materials; only update if information becomes outdated
- **Drafts** - Update as needed for marketing/communication purposes

## What Not to Delete

Keep all documents that provide reference material for Sui or Walrus development, as these technologies are:
- Relatively new (2024-2026)
- Not well covered by general AI training data
- Full of specific patterns and gotchas that aren't widely known

The tutorial and learnings docs are particularly valuable for context when working with AI coding assistants.
