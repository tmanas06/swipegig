// src/contexts/ProfileContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getTokenBalances, getNFTs, TokenBalance, NFT } from '../services/jupiter';

interface ProfileContextType {
  tokenBalances: TokenBalance[];
  nfts: NFT[];
  loading: boolean;
  error: string | null;
  refreshBalances: (address?: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = useCallback(async (address?: string) => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate Solana address
      try {
        new PublicKey(address);
      } catch (err) {
        throw new Error('Invalid Solana address');
      }

      const [balances, nftData] = await Promise.all([
        getTokenBalances(address),
        getNFTs(address)
      ]);
      
      setTokenBalances(balances);
      setNfts(nftData);
    } catch (err) {
      console.error('Error refreshing balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ProfileContext.Provider value={{ 
      tokenBalances, 
      nfts, 
      loading, 
      error, 
      refreshBalances 
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};