# Sui Transaction Building and Debugging Learnings

## Overview

This document captures key learnings from building and debugging Sui transactions, particularly around package upgrades, shared objects, and object versioning.

## Package Upgrades

### The Challenge

When a Sui package is upgraded, existing objects retain their original package ID in their type, but the system needs to use the new package's functions.

**Example:**
- Old package: `0xfdc88f7d...`
- New package: `0xfa65cb2d...`
- Blob type: `0xfdc88f7d...::blob::Blob` (created with old package)
- Function to call: `0xfa65cb2d...::system::extend_blob` (new package)

### The Solution

**Always use the current package ID from the system object**, not a hardcoded constant:

```javascript
const systemObject = await walrusClient.systemObject();
const walrusPackageId = systemObject.package_id; // Gets the current active package

tx.moveCall({
  target: `${walrusPackageId}::system::extend_blob`,
  arguments: [...]
});
```

### Why This Works

Sui's upgrade system maintains **layout compatibility** across package versions:
- Struct layouts must remain the same
- Public function signatures must remain the same
- Move treats types from old and new packages as compatible

When you call a function from an upgraded package with an object from the old package, Sui's runtime handles the type compatibility automatically. This is documented in the [Sui Package Upgrade Guide](https://docs.sui.io/guides/developer/packages/upgrade).

## Shared Objects and Initial Shared Version

### The Critical Distinction

Shared objects in Sui have **two different version numbers**:

1. **Internal version field** - A logical version counter defined in the Move struct
2. **Initial shared version** - The blockchain version when the object was first shared

For transactions, you **must use the initial_shared_version**, not the internal version field.

### The Bug

```javascript
// ❌ WRONG - Uses internal version field
const systemObject = await walrusClient.systemObject();
const systemObjRef = tx.sharedObjectRef({
  objectId: systemObjectId,
  initialSharedVersion: systemObject.version, // This is "2" (internal field)
  mutable: true,
});
```

### The Fix

```javascript
// ✅ CORRECT - Fetches the actual initial_shared_version
const fullSystemObject = await client.getObject({
  id: systemObjectId,
  options: { showOwner: true }
});

const initialSharedVersion = fullSystemObject.data.owner.Shared.initial_shared_version;

const systemObjRef = tx.sharedObjectRef({
  objectId: systemObjectId,
  initialSharedVersion: initialSharedVersion, // This is 317862159 (blockchain version)
  mutable: true,
});
```

### Why This Matters

The `initialSharedVersion` is used by Sui to:
- Properly sequence transactions accessing the shared object
- Ensure consensus ordering for shared object access
- Prevent race conditions and conflicts

Using the wrong version causes the transaction to fail with 504 timeouts or invalid object reference errors.

## Object Structure Inspection

### Checking Object Details

Always inspect the full object structure to understand what you're working with:

```javascript
const obj = await client.getObject({
  id: objectId,
  options: {
    showContent: true,
    showType: true,
    showOwner: true,
  }
});
```

### Key Fields to Check

**For Shared Objects:**
```javascript
{
  "owner": {
    "Shared": {
      "initial_shared_version": 317862159  // Use this for transactions!
    }
  },
  "version": "757339152",  // Current object version (for owned objects)
  "type": "0xfdc88f7d...::system::System"  // Shows the package ID
}
```

**For Owned Objects:**
```javascript
{
  "owner": {
    "AddressOwner": "0xe89b9c54..."  // Owner address
  },
  "version": "754152986",  // SDK auto-fetches this during tx.build()
  "type": "0xfdc88f7d...::blob::Blob"
}
```

## Object Versioning Best Practices

### Owned Objects

For owned objects (blobs, coins), the Sui SDK automatically fetches the latest version during `tx.build()`:

```javascript
// No need to manually specify version
tx.object(blobId)  // SDK handles versioning
```

### Shared Objects

For shared objects, you must explicitly provide the `initialSharedVersion`:

```javascript
tx.sharedObjectRef({
  objectId: systemObjectId,
  initialSharedVersion: initialSharedVersion,  // Required!
  mutable: true,
});
```

## Debugging Techniques

### 1. Inspect Transaction Serialization

When a transaction fails, examine the serialized transaction bytes:

```javascript
const result = await signAndExecuteTransaction(tx);
console.log('Transaction:', JSON.stringify(result, null, 2));
```

Look for:
- Correct sender address
- Correct object IDs
- Correct initial_shared_version values

### 2. Verify Object Existence and State

Before submitting a transaction, verify all objects exist and are in the expected state:

```javascript
const obj = await client.getObject({ id: objectId, options: { showContent: true }});
console.log('Object state:', obj);
```

### 3. Check Epoch and Extension Limits

For Walrus-specific operations, verify epoch calculations:

```javascript
const currentEpoch = await walrusClient.getEpochNumber();
const maxEpochsAheadOffset = systemState.max_epochs_ahead;
const currentOffset = blob.expiryEpoch - currentEpoch;
const maxSafeExtend = maxEpochsAheadOffset - currentOffset;
```

### 4. Use Detailed Logging

Add comprehensive logging to track the transaction building process:

```javascript
console.log('System object:', systemObject);
console.log('Using package ID:', walrusPackageId);
console.log('Initial shared version:', initialSharedVersion);
console.log('Transaction inputs:', tx.getData());
```

## Common Errors and Solutions

### Error: 504 Timeout from Full Node

**Cause:** Usually indicates an invalid transaction that causes the full node to hang
- Wrong `initialSharedVersion` for shared objects
- Invalid object references
- Type mismatches in Move calls

**Solution:** Verify all object versions and IDs are correct

### Error: Object Version Mismatch

**Cause:** Using stale object versions in owned objects
**Solution:** Let the SDK handle versioning with `tx.object(id)` instead of manually specifying versions

### Error: Invalid Package ID in Move Call

**Cause:** Using a hardcoded old package ID instead of the current active package
**Solution:** Dynamically fetch package ID from system object

## Transaction Execution Best Practices

### Set Request Type

Always specify the request type for proper execution:

```javascript
await wallet.signAndExecuteTransaction({
  transaction: tx,
  requestType: 'WaitForLocalExecution',  // Ensures full execution
  options: {
    showEffects: true,
    showObjectChanges: true
  }
});
```

### Gas Budget

Set appropriate gas budgets:
- Simple operations (burn): 100_000_000 (0.1 SUI)
- Complex operations (extend with payments): 500_000_000 (0.5 SUI)

### Coin Selection Optimization

Select only the coins needed instead of merging all:

```javascript
let selectedCoins = [];
let accumulatedBalance = 0n;

for (const coin of walCoins.data) {
  selectedCoins.push(coin);
  accumulatedBalance += BigInt(coin.balance);
  
  if (accumulatedBalance >= estimatedPayment) {
    break; // Stop when we have enough
  }
}
```

## Key Takeaways

1. **Always fetch current package ID dynamically** - Don't hardcode package addresses
2. **Use `initial_shared_version` from owner field** - Not the internal version field
3. **Let SDK handle owned object versions** - Don't manually specify versions for owned objects
4. **Inspect full object structure** - Use `showOwner: true` to see sharing info
5. **Package upgrades are type-compatible** - Objects from old packages work with new package functions
6. **Add comprehensive logging** - Makes debugging much easier
7. **Verify object state before transactions** - Prevents wasted gas and failed transactions

## References

- [Sui Package Upgrade Guide](https://docs.sui.io/guides/developer/packages/upgrade)
- [Sui Transaction Building](https://sdk.mystenlabs.com/typescript/transaction-building/basics)
- [Shared Objects Documentation](https://docs.sui.io/guides/developer/objects/object-ownership/shared)
