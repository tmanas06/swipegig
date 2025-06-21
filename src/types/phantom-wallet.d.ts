import { Transaction } from '@solana/web3.js';

// Extend the existing Phantom wallet interface
declare global {
  interface Window {
    phantom?: {
      solana: {
        isPhantom?: boolean;
        connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
        disconnect: () => Promise<void>;
        on: (event: string, callback: (args: any) => void) => void;
        off: (event: string, callback: (args: any) => void) => void;
        isConnected: boolean;
        publicKey?: {
          toString: () => string;
        };
        signTransaction: (transaction: Transaction) => Promise<Transaction>;
        signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
        // Add any additional methods that might be needed
        [key: string]: any;
      };
    };
  }
}
