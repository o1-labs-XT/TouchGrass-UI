'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type WalletChoice = 'auro' | 'generated' | null;

interface WalletContextType {
  // Wallet choice
  walletChoice: WalletChoice;
  setWalletChoice: (choice: 'auro' | 'generated') => void;

  // Auro wallet state
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

  const setWalletChoice = (choice: 'auro' | 'generated') => {
    setWalletChoiceState(choice);
  };

  const value = {
    walletChoice,
    setWalletChoice,
    // Temporary placeholders for Auro wallet state
    isInstalled: false,
    isConnecting: false,
    isConnected: false,
    address: null,
    error: null,
    reconnect: async () => {},
    signFields: async () => ({ data: [], signature: '' }),
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
