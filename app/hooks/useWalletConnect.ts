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

  const updateSessionState = useCallback((currentSession: any) => {
    if (currentSession) {
      setSession(currentSession);
      const minaAccounts = currentSession.namespaces?.mina?.accounts || [];
      if (minaAccounts.length > 0) {
        const minaAddress = minaAccounts[0].split(":")[2];
        setAccount(minaAddress);
        setIsConnected(true);
        console.log("Connected with account:", minaAddress);
      } else {
        setError("No accounts found in session");
      }
    } else {
      setError("No session established");
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const walletClient = await initWalletConnect();
      setClient(walletClient);
      const currentSession = getCurrentSession(walletClient);
      updateSessionState(currentSession);
    } catch (error: any) {
      setError(error.message || "Failed to connect to Auro Wallet");
      console.error("Connection error:", error);
    }
  }, [updateSessionState]);
}
