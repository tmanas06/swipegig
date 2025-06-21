// Phantom Wallet Provider
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        on: (event: string, callback: (args: any) => void) => void;
        isConnected: boolean;
        publicKey?: {
          toString: () => string;
        };
      };
    };
  }
}

export const isPhantomInstalled = (): boolean => {
  return !!window.phantom?.solana?.isPhantom;
};

export const connectPhantom = async () => {
  if (!isPhantomInstalled()) {
    window.open('https://phantom.app/', '_blank');
    throw new Error('Phantom wallet is not installed');
  }

  try {
    const response = await window.phantom?.solana?.connect();
    return response?.publicKey.toString();
  } catch (error) {
    console.error('Failed to connect to Phantom:', error);
    throw error;
  }
};

export const disconnectPhantom = async () => {
  if (window.phantom?.solana) {
    await window.phantom.solana.disconnect();
  }
};
