'use client';
import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

export default function DebugPanel() {
  const { walletChoice, isConnected, address } = useWallet();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const newLogs = [
      `Time: ${new Date().toLocaleTimeString()}`,
      `walletChoice: ${walletChoice || 'NULL'}`,
      `isConnected: ${isConnected}`,
      `address: ${address || 'NULL'}`,
      `window.mina: ${typeof window.mina !== 'undefined' ? 'EXISTS' : 'UNDEFINED'}`,
      `localStorage.walletChoice: ${localStorage.getItem('walletChoice') || 'NULL'}`,
      `localStorage.minaKeypair: ${localStorage.getItem('minaKeypair') ? 'EXISTS' : 'NULL'}`,
      `localStorage keys: ${Object.keys(localStorage).join(', ') || 'NONE'}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent.substring(0, 50)}...`
    ];
    setLogs(newLogs);
  }, [walletChoice, isConnected, address]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: '#00ff00',
      padding: '10px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: 9999,
      borderTop: '2px solid #00ff00'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#ffff00' }}>
        🐛 DEBUG PANEL (Tap to scroll)
      </div>
      {logs.map((log, i) => (
        <div key={i} style={{ marginBottom: '3px' }}>
          {log}
        </div>
      ))}
    </div>
  );
}
