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
      console.log('[DEBUG] checkAndConnect called, retryCount:', retryCount);

      if (typeof window.mina === 'undefined') {
        console.log('[DEBUG] window.mina undefined, retry:', retryCount);
        // Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          retryTimer = setTimeout(checkAndConnect, 100);
          return;
        }

        console.log('[DEBUG] Max retries reached, wallet not installed');
        setWalletState(prev => ({
          ...prev,
          isInstalled: false,
          error: 'Auro wallet not installed',
        }));
        return;
      }

      // Only auto-connect if user chose Auro wallet
      const walletChoice = sessionStorage.getItem('walletChoice');
      console.log('[DEBUG] window.mina found, walletChoice:', walletChoice);

      if (walletChoice !== 'auro') {
        console.log('[DEBUG] walletChoice is not auro, skipping auto-connect');
        setWalletState(prev => ({
          ...prev,
          isInstalled: true,
          isConnecting: false,
        }));
        return;
      }

      console.log('[DEBUG] Starting auto-connect...');

      setWalletState(prev => ({
        ...prev,
        isInstalled: true,
        isConnecting: true,
      }));

      try {
        let accounts: string[] = [];

        if (window.mina.getAccounts) {
          console.log('[DEBUG] Calling getAccounts()...');
          accounts = await window.mina.getAccounts();
          console.log('[DEBUG] getAccounts() returned:', accounts);
        }

        if (accounts.length === 0) {
          console.log('[DEBUG] No accounts from getAccounts, calling requestAccounts()...');
          accounts = await window.mina.requestAccounts();
          console.log('[DEBUG] requestAccounts() returned:', accounts);
        }

        if (accounts.length > 0) {
          console.log('[DEBUG] Auto-connect successful, address:', accounts[0]);
          setWalletState({
            isInstalled: true,
            isConnecting: false,
            isConnected: true,
            address: accounts[0],
            error: null,
          });
        } else {
          console.log('[DEBUG] No accounts available after requestAccounts');
          setWalletState(prev => ({
            ...prev,
            isConnecting: false,
            error: 'No accounts available',
          }));
        }
      } catch (error: any) {
        console.error('[DEBUG] Auto-connect error:', error);
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
    console.log('[DEBUG] reconnect called, window.mina:', typeof window.mina);

    if (!window.mina) {
      console.log('[DEBUG] window.mina is undefined, wallet not available');
      return;
    }

    console.log('[DEBUG] Requesting accounts from Auro wallet...');
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.mina.requestAccounts();
      console.log('[DEBUG] Accounts received:', accounts);

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
      console.error('[DEBUG] reconnect error:', error);
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
