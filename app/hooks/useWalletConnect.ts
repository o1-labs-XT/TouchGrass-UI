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

  // Detect iOS vs Android for correct return scheme
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  // iOS Safari doesn't need scheme parameter (auto-returns)
  // Android Chrome needs com.android.chrome to return to browser
  const chromeScheme = isAndroid ? "com.android.chrome" : "";
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

  const disconnect = useCallback(async () => {
    if (!client || !session) {
      setError("No active connection to disconnect");
      return;
    }
    try {
      await client.disconnect({
        topic: session.topic,
        reason: { code: 6000, message: "User disconnected" },
      });
      setAccount(null);
      setSession(null);
      setClient(null);
      setIsConnected(false);
      setError(null);
      console.log("Disconnected from Auro Wallet");
    } catch (error: any) {
      setError(error.message || "Failed to disconnect");
      console.error("Disconnect error:", error);
    }
  }, [client, session]);

  const signFields = useCallback(
    async (fields: (string | number)[]) => {
      if (!client || !session || !account) {
        throw new Error("Please connect wallet first");
      }

      try {
        const request = {
          topic: session.topic,
          chainId: selectedChain,
          request: {
            method: "mina_signFields",
            params: {
              scheme: chromeScheme,
              from: account,
              message: fields,
            },
          },
        };
        const result = await client.request(request);
        console.log("Sign fields result:", result);
        return result;
      } catch (error: any) {
        console.error("Failed to sign fields:", error);
        throw error;
      }
    },
    [client, session, account, chromeScheme, selectedChain]
  );

  useEffect(() => {
    if (!client) return;

    const handleSessionUpdated = (event: CustomEvent) => {
      const updatedSession = getCurrentSession(client);
      updateSessionState(updatedSession);
    };

    const handleAccountsChanged = (event: CustomEvent) => {
      const newAccounts = event.detail || [];
      if (newAccounts.length > 0) {
        const newAddress = newAccounts[0].split(":")[2];
        setAccount(newAddress);
        console.log("Account changed to:", newAddress);
      } else {
        setAccount(null);
        setError("No accounts available after change");
      }
    };

    const handleSessionDeleted = () => {
      setAccount(null);
      setSession(null);
      setClient(null);
      setIsConnected(false);
      setError("Session disconnected by wallet");
      console.log("Session deleted");
    };

    window.addEventListener("sessionUpdated", handleSessionUpdated as EventListener);
    window.addEventListener("accountsChanged", handleAccountsChanged as EventListener);
    window.addEventListener("sessionDeleted", handleSessionDeleted);

    return () => {
      window.removeEventListener("sessionUpdated", handleSessionUpdated as EventListener);
      window.removeEventListener("accountsChanged", handleAccountsChanged as EventListener);
      window.removeEventListener("sessionDeleted", handleSessionDeleted);
    };
  }, [client, updateSessionState]);

  return {
    isConnected,
    address: account,
    error,
    connect,
    disconnect,
    signFields,
  };
}
