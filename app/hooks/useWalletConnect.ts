import { useState, useEffect, useCallback } from "react";
import {
  initWalletConnect,
  getCurrentSession,
  WalletConnectClient,
} from "../lib/walletConnect";

export function useWalletConnect() {
  const [client, setClient] = useState<WalletConnectClient | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const chromeScheme = isMobile ? "com.android.chrome" : "";
  const selectedChain = "mina:devnet";
}
