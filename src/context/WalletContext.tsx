import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

// Rootstock Testnet configuration from the screenshot
const ROOTSTOCK_TESTNET = {
  chainId: '0x1f', // 31 in hexadecimal
  chainName: 'Rootstock Testnet',
  rpcUrls: ['https://public-node.testnet.rsk.co'],
  nativeCurrency: {
    name: 'Test RBTC',
    symbol: 'tRBTC',
    decimals: 18
  },
  blockExplorerUrls: ['https://explorer.testnet.rsk.co']
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

  const switchToRootstockTestnet = async () => {
    if (!window.ethereum) return false;
    
    const testnetChainId = '0x1f'; // 31 in hex
    
    try {
      // Try to switch to Rootstock Testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: testnetChainId }],
      });
      return true;
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          // Add the Rootstock Testnet network
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ROOTSTOCK_TESTNET],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Rootstock Testnet:', addError);
          toast.error('Failed to add Rootstock Testnet to your wallet');
          return false;
        }
      } else {
        console.error('Error switching to Rootstock Testnet:', error);
        toast.error('Failed to switch to Rootstock Testnet');
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
      
      // Switch to Rootstock Testnet
      const switched = await switchToRootstockTestnet();
      if (!switched) {
        toast.error('Please connect to Rootstock Testnet to use this application');
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
        
        toast.success('Connected to Rootstock Testnet successfully!');
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
