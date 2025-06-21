/** @jsxImportSource react */
import React from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Button } from './ui/button';

export const WalletConnectButton = () => {
  const { connected, publicKey, connect, disconnect } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Truncate the public key for display
  const displayAddress = publicKey ? 
    `${publicKey.toString().substring(0, 4)}...${publicKey.toString().substring(publicKey.toString().length - 4)}` : 
    '';

  return (
    <div className="flex items-center space-x-2">
      {connected ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{displayAddress}</span>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <Button onClick={handleConnect}>
          Connect Wallet
        </Button>
      )}
    </div>
  );
};
