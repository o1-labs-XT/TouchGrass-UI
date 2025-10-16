'use client';
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    mina?: {
      requestAccounts: () => Promise<string[]>;
      getAccounts?: () => Promise<string[]>;
      on?: (event: string, handler: (accounts: string[]) => void) => void;
      off?: (event: string, handler: (accounts: string[]) => void) => void;
      signFields: (params: { message: (string | number)[] }) => Promise<{
        data: (string | number)[];
        signature: string;
      }>;
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
    let retryCount = 0;
    const maxRetries = 20; // Try for ~2 seconds (20 * 100ms)
    let retryTimer: NodeJS.Timeout;

    const checkAndConnect = async () => {
      if (typeof window.mina === 'undefined') {
        // Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          retryTimer = setTimeout(checkAndConnect, 100);
          return;
        }

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
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (window.mina?.off) {
        window.mina.off('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const reconnect = async () => {
    if (!window.mina) return;

    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.mina.requestAccounts();
      if (accounts.length > 0) {
        setWalletState({
          isInstalled: true,
          isConnecting: false,
          isConnected: true,
          address: accounts[0],
          error: null,
        });
      }
    } catch (error: any) {
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to reconnect',
      }));
    }
  };

  const signFields = async (fields: (string | number)[]) => {
    if (!window.mina || !walletState.isConnected) {
      throw new Error('Wallet not connected');
    }

    if (!window.mina.signFields) {
      throw new Error('signFields not supported by this wallet version');
    }

    return await window.mina.signFields({ message: fields });
  };

  return {
    ...walletState,
    reconnect,
    signFields,
  };
}
