import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

// Solana Mainnet configuration
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        on: (event: string, callback: (args: any) => void) => void;
        off: (event: string, callback: (args: any) => void) => void;
        isConnected: boolean;
        publicKey?: {
          toString: () => string;
        };
      };
    };
  }
}

// Jupiter API configuration
export const JUPITER_CONFIG = {
  apiBaseUrl: 'https://quote-api.jup.ag/v6', // Jupiter API endpoint
  defaultSlippageBps: 50, // 0.5% slippage
};

type WalletContextType = {
  account: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  userRole: 'freelancer' | 'client' | null;
  setUserRole: (role: 'freelancer' | 'client' | null) => void;
  networkId: number | null;
  balance: number | null;
  isPhantomInstalled: boolean;
};

const WalletContext = createContext<WalletContextType>({
  account: null,
  isConnecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  userRole: null,
  setUserRole: () => {},
  networkId: null,
  balance: null,
  isPhantomInstalled: false,
});

const useWallet = () => useContext(WalletContext);

const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('walletAddress') || null;
    }
    return null;
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [userRole, setUserRole] = useState<'freelancer' | 'client' | null>(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      return role === 'freelancer' || role === 'client' ? role : null;
    }
    return null;
  });
  const [networkId, setNetworkId] = useState<number | null>(1); // Default to Solana Mainnet
  const [balance, setBalance] = useState<number | null>(null);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

  // Check if Phantom is installed
  useEffect(() => {
    setIsPhantomInstalled(!!window.phantom?.solana?.isPhantom);
  }, []);

  // Fetch SOL balance using Jupiter API
  const fetchSolBalance = useCallback(async (publicKey: string) => {
    try {
      // In a real app, you would fetch the actual balance from the Solana network
      // This is a placeholder implementation
      setBalance(0); // Set to 0 as a placeholder
      
      // Example of how you might fetch balance in a real app:
      // const response = await fetch(`${JUPITER_CONFIG.apiBaseUrl.replace('/v6', '')}/account/${publicKey}/balance`);
      // const data = await response.json();
      // setBalance(Number(data.result?.value || 0) / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    }
  }, []);

  // Handle account change
  const handleAccountChanged = useCallback((publicKey: string | null) => {
    if (publicKey) {
      setAccount(publicKey);
      fetchSolBalance(publicKey);
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', publicKey);
      setNetworkId(1); // Solana Mainnet
    } else {
      setAccount(null);
      setBalance(null);
      setNetworkId(null);
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
    }
  }, [fetchSolBalance]);

  // Check wallet connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (isPhantomInstalled && window.phantom?.solana) {
        try {
          const response = await window.phantom.solana.connect({ onlyIfTrusted: true });
          const publicKey = response.publicKey.toString();
          handleAccountChanged(publicKey);
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      } else if (localStorage.getItem('walletConnected') && localStorage.getItem('walletAddress')) {
        // If we have a stored connection but Phantom isn't connected, clear the stored connection
        handleAccountChanged(null);
      }
    };

    checkConnection();
  }, [isPhantomInstalled, handleAccountChanged]);

  // Set up event listeners
  useEffect(() => {
    if (!window.phantom?.solana) return;

    const handleConnect = (publicKey: { toString: () => string }) => {
      handleAccountChanged(publicKey.toString());
    };

    const handleDisconnect = () => {
      handleAccountChanged(null);
    };

    window.phantom.solana.on('connect', handleConnect);
    window.phantom.solana.on('disconnect', handleDisconnect);

    return () => {
      window.phantom?.solana?.off('connect', handleConnect);
      window.phantom?.solana?.off('disconnect', handleDisconnect);
    };
  }, [handleAccountChanged]);

  const connectWallet = useCallback(async () => {
    if (!window.phantom?.solana) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      // Connect to Phantom wallet
      const response = await window.phantom.solana.connect();
      const publicKey = response.publicKey.toString();
      
      // Update account and fetch balance
      handleAccountChanged(publicKey);
      toast.success('Connected to Phantom wallet');
    } catch (error) {
      console.error('Error connecting to Phantom:', error);
      toast.error('Failed to connect to Phantom wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [handleAccountChanged]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (window.phantom?.solana) {
        await window.phantom.solana.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      handleAccountChanged(null);
      setUserRole(null);
      localStorage.removeItem('userRole');
      toast.info('Wallet disconnected');
    }
  }, [handleAccountChanged]);

  const handleRoleChange = useCallback((role: 'freelancer' | 'client' | null) => {
    setUserRole(role);
    if (role) {
      localStorage.setItem('userRole', role);
    } else {
      localStorage.removeItem('userRole');
    }
  }, []);

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
        balance,
        isPhantomInstalled,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export { WalletContext, WalletProvider, useWallet };

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
