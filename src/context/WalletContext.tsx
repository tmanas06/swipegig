import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

// Rootstock Testnet configuration from the screenshot
// Solana Testnet configuration
const SOLANA_TESTNET = {
  chainId: '0x1', // Solana Devnet uses chain ID 1
  chainName: 'Solana Devnet',
  rpcUrls: ['https://api.devnet.solana.com'],
  nativeCurrency: {
    name: 'SOL',
    symbol: 'SOL',
    decimals: 9,
  },
  blockExplorerUrls: ['https://explorer.solana.com/?cluster=devnet'],
};


type WalletContextType = {
  account: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  userRole: 'freelancer' | 'client' | null;
  setUserRole: (role: 'freelancer' | 'client' | null) => void;
  networkId: number | null;
};

const WalletContext = createContext<WalletContextType>({
  account: null,
  isConnecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  userRole: null,
  setUserRole: () => {},
  networkId: null,
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'freelancer' | 'client' | null>(null);
  const [networkId, setNetworkId] = useState<number | null>(null);

  useEffect(() => {
    // Check if user was previously connected
    const savedAccount = localStorage.getItem('walletAccount');
    const savedRole = localStorage.getItem('userRole') as 'freelancer' | 'client' | null;
    
    if (savedAccount) {
      setAccount(savedAccount);
    }
    
    if (savedRole) {
      setUserRole(savedRole);
    }

    // Setup network change listener
    if (window.ethereum) {
      const handleChainChanged = (chainId: string) => {
        setNetworkId(parseInt(chainId, 16));
      };
      
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Get initial network
      window.ethereum.request({ method: 'eth_chainId' })
        .then((chainId: string) => setNetworkId(parseInt(chainId, 16)))
        .catch(console.error);
        
      return () => {
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const switchToSolanaTestnet = async () => {
    if (!window.ethereum) return false;
  
    const testnetChainId = '0x1'; // Solana Devnet chain ID
  
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: testnetChainId }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SOLANA_TESTNET],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Solana Testnet:', addError);
          toast.error('Failed to add Solana Testnet to your wallet');
          return false;
        }
      } else {
        console.error('Error switching to Solana Testnet:', error);
        toast.error('Failed to switch to Solana Testnet');
        return false;
      }
    }
  };
  

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected! Please install MetaMask to connect.');
      return;
    }

    setIsConnecting(true);

    try {
      // Request accounts
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Switch to Solana Testnet
      const switched = await switchToSolanaTestnet();
      if (!switched) {
        toast.error('Please connect to Solana Testnet to use this application');
        setIsConnecting(false);
        return;
      }

      
      // Get current accounts
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        localStorage.setItem('walletAccount', accounts[0]);
        
        // Get current network after switch
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setNetworkId(parseInt(chainId, 16));
        
        toast.success('Connected to Solana Testnet successfully!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setUserRole(null);
    setNetworkId(null);
    localStorage.removeItem('walletAccount');
    localStorage.removeItem('userRole');
    toast.info('Wallet disconnected');
  };

  const handleRoleChange = (role: 'freelancer' | 'client' | null) => {
    setUserRole(role);
    if (role) {
      localStorage.setItem('userRole', role);
    } else {
      localStorage.removeItem('userRole');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnecting,
        connectWallet,
        disconnectWallet,
        userRole,
        setUserRole: handleRoleChange,
        networkId,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}
