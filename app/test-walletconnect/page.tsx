"use client";

import { useState } from "react";
import { useWalletConnect } from "../hooks/useWalletConnect";

export default function TestWalletConnect() {
  const { isConnected, address, error, connect, disconnect, signFields } =
    useWalletConnect();
  const [responseData, setResponseData] = useState<string>("");

  const handleTestSignFields = async () => {
    try {
      setResponseData("Signing...");
      const testFields = [1, 2, 3];

      const result = await signFields(testFields);

      // Build detailed response info to display
      const info = [
        "=== WalletConnect Response ===",
        "",
        "Full JSON:",
        JSON.stringify(result, null, 2),
        "",
        `Type: ${typeof result}`,
        `Keys: [${Object.keys(result).join(", ")}]`,
        "",
        `Has 'signature' key? ${result && "signature" in result}`,
        `Has 'data' key? ${result && "data" in result}`,
        "",
        result && "signature" in result
          ? `signature type: ${typeof (result as any).signature}`
          : "",
        result && "data" in result
          ? `data type: ${typeof (result as any).data}`
          : "",
      ].join("\n");

      setResponseData(info);
      console.log(info);
    } catch (err: any) {
      const errorInfo = `Error: ${err.message}\n\nStack: ${err.stack}`;
      setResponseData(errorInfo);
      console.error("Sign fields error:", err);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>WalletConnect Test Page</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error}
        </div>
      )}

      <div style={{ marginBottom: "20px" }}>
        <strong>Status:</strong> {isConnected ? "Connected" : "Disconnected"}
      </div>

      {address && (
        <div style={{ marginBottom: "20px" }}>
          <strong>Address:</strong> {address}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {!isConnected ? (
          <button
            onClick={connect}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Connect WalletConnect
          </button>
        ) : (
          <button
            onClick={disconnect}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Disconnect
          </button>
        )}
      </div>

      {isConnected && (
        <button
          onClick={handleTestSignFields}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Test signFields([1, 2, 3])
        </button>
      )}

      {responseData && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "4px",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "12px",
            overflowX: "auto",
          }}
        >
          {responseData}
        </div>
      )}

      <div style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Click "Connect WalletConnect"</li>
          <li>Scan QR with Auro Wallet (or deep link on mobile)</li>
          <li>Once connected, click "Test signFields"</li>
          <li>Approve in Auro Wallet</li>
          <li>Response format will appear on this page</li>
        </ol>
      </div>
    </div>
  );
}
