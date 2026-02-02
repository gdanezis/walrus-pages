import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ConnectButton,
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

import { SUI_RPC_URL } from '../config/constants.js';
import { updateWalletBridgeState } from './wallet-state.js';

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  mainnet: { url: SUI_RPC_URL },
});

function WalletStateBridge() {
  const currentAccount = useCurrentAccount();
  const { currentWallet, connectionStatus } = useCurrentWallet();
  const disconnect = useDisconnectWallet();
  const suiClient = useSuiClient();
  const signAndExecute = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) => {
      return suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
        requestType: 'WaitForLocalExecution',
      });
    },
  });

  useEffect(() => {
    updateWalletBridgeState({
      wallet: currentWallet ?? null,
      account: currentAccount ?? null,
      status: connectionStatus,
      disconnect: disconnect.mutateAsync ?? null,
      signAndExecute: signAndExecute.mutateAsync ?? null,
    });
  }, [
    currentAccount,
    currentWallet,
    connectionStatus,
    disconnect.mutateAsync,
    suiClient,
    signAndExecute.mutateAsync,
  ]);

  return null;
}

function WalletConnectProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider autoConnect>
          <WalletStateBridge />
          <div className="wallet-connect-button">
            <ConnectButton
              data-wallet-connect-trigger="true"
              connectText="🔗 Connect Wallet"
            />
          </div>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export function mountWalletConnectButton(target) {
  const container = typeof target === 'string' ? document.getElementById(target) : target;
  if (!container) {
    console.warn('Wallet connect container not found');
    return null;
  }

  const root = createRoot(container);
  root.render(<WalletConnectProviders />);
  return root;
}
