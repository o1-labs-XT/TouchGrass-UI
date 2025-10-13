'use client';
import { useState } from 'react';

declare global {
  interface Window {
    mina?: {
      requestAccounts: () => Promise<string[]>;
    };
  }
}

export interface WalletState {
  isInstalled: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  error: string | null;
}

export function useAuroWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isInstalled: false,
    isConnecting: false,
    isConnected: false,
    address: null,
    error: null,
  });

  return walletState;
}
