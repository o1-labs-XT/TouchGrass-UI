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
  const auroWallet = useAuroWallet(); // Single instance for entire app

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('walletChoice');
    if (stored === 'auro' || stored === 'generated') {
      setWalletChoiceState(stored);
    }
  }, []);

  const setWalletChoice = (choice: 'auro' | 'generated') => {
    sessionStorage.setItem('walletChoice', choice);
    setWalletChoiceState(choice);
  };

  const value = {
    walletChoice,
    setWalletChoice,
    ...auroWallet, // Spread actual Auro wallet state
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
