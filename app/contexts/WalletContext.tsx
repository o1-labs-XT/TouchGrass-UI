'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuroWallet } from '../hooks/useAuroWallet';

type WalletChoice = 'auro' | 'generated' | null;

interface WalletContextType {
  walletChoice: WalletChoice;
  setWalletChoice: (choice: 'auro' | 'generated') => void;
  isInstalled: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  error: string | null;
  reconnect: () => Promise<void>;
  signFields: (fields: (string | number)[]) => Promise<{
    data: (string | number)[];
    signature: string;
  }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletChoice, setWalletChoiceState] = useState<WalletChoice>(null);
  const [generatedAddress, setGeneratedAddress] = useState<string | null>(null);
  const auroWallet = useAuroWallet();

  async function generateKeypair() {
    try {
      const TouchGrassWorkerClient = (await import('../TouchGrassWorkerClient')).default;
      const worker = new TouchGrassWorkerClient();

      const minaKeypair = await worker.generateKeypair();
      localStorage.setItem('minaKeypair', JSON.stringify({
        privateKey: minaKeypair.privateKey,
        publicKey: minaKeypair.publicKey
      }));

      setGeneratedAddress(minaKeypair.publicKey);
    } catch (err) {
      console.error('Failed to generate keypair:', err);
    }
  }

  // Load from localStorage on mount
  useEffect(() => {
    console.log('[WalletContext] useEffect RUNNING - this should always appear');
    const stored = localStorage.getItem('walletChoice');
    console.log('[WalletContext] localStorage.walletChoice:', stored);
    console.log('[WalletContext] window.mina exists:', typeof window.mina !== 'undefined');
    console.log('[WalletContext] All localStorage keys:', Object.keys(localStorage));

    if (stored === 'auro' || stored === 'generated') {
      setWalletChoiceState(stored);
    } else {
      console.log('[WalletContext] walletChoice is null - checking URL params');
      // Check URL parameter as fallback for Auro browser redirect
      const params = new URLSearchParams(window.location.search);
      const walletParam = params.get('wallet');
      console.log('[WalletContext] URL wallet param:', walletParam);

      if (walletParam === 'auro' || walletParam === 'generated') {
        console.log('[WalletContext] Setting walletChoice from URL param:', walletParam);
        setWalletChoice(walletParam);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Load existing keypair from localStorage for generated wallets
  useEffect(() => {
    if (walletChoice === 'generated') {
      const keypairData = localStorage.getItem('minaKeypair');
      if (keypairData) {
        try {
          const keypair = JSON.parse(keypairData);
          setGeneratedAddress(keypair.publicKey);
        } catch (err) {
          console.error('Failed to parse minaKeypair:', err);
        }
      } else {
        generateKeypair();
      }
    }
  }, [walletChoice]);

  const setWalletChoice = (choice: 'auro' | 'generated') => {
    localStorage.setItem('walletChoice', choice);
    setWalletChoiceState(choice);
  };

  const value = {
    walletChoice,
    setWalletChoice,
    ...(walletChoice === 'generated'
      ? {
          ...auroWallet,
          address: generatedAddress,
          isConnected: !!generatedAddress,
        }
      : auroWallet),
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
