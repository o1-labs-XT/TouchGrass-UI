'use client';
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    mina?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts?: () => Promise<string[]>;
      on?: (event: string, handler: (accounts: string[]) => void) => void;
      off?: (event: string, handler: (accounts: string[]) => void) => void;
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

  useEffect(() => {
    const checkAndConnect = async () => {
      if (typeof window.mina === 'undefined') {
        setWalletState(prev => ({
          ...prev,
          isInstalled: false,
          error: 'Auro wallet not installed',
        }));
        return;
      }

      setWalletState(prev => ({
        ...prev,
        isInstalled: true,
        isConnecting: true,
      }));

      try {
        let accounts: string[] = [];

        if (window.mina.getAccounts) {
          accounts = await window.mina.getAccounts();
        }

        if (accounts.length === 0) {
          accounts = await window.mina.requestAccounts();
        }

        if (accounts.length > 0) {
          setWalletState({
            isInstalled: true,
            isConnecting: false,
            isConnected: true,
            address: accounts[0],
            error: null,
          });
        } else {
          setWalletState(prev => ({
            ...prev,
            isConnecting: false,
            error: 'No accounts available',
          }));
        }
      } catch (error: any) {
        setWalletState(prev => ({
          ...prev,
          isConnecting: false,
          isConnected: false,
          error: error.message || 'Failed to connect wallet',
        }));
      }
    };

    const timer = setTimeout(checkAndConnect, 100);

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0],
          error: null,
        }));
      } else {
        setWalletState(prev => ({
          ...prev,
          isConnected: false,
          address: null,
        }));
      }
    };

    if (window.mina?.on) {
      window.mina.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      clearTimeout(timer);
      if (window.mina?.off) {
        window.mina.off('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return walletState;
}
