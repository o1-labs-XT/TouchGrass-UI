'use client';
import { createContext, useContext, ReactNode } from 'react';

interface WalletContextType {
  // To be filled in next commits
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const value = {};

  return (
    <WalletContext.Provider value={value as WalletContextType}>
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
