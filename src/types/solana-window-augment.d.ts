import { Transaction } from '@solana/web3.js';

declare module '@solana/wallet-adapter-base' {
  interface WalletAdapterProps {
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  }
}

declare global {
  interface Window {
    phantom?: {
      solana: {
        signTransaction: (transaction: Transaction) => Promise<Transaction>;
        signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      };
    };
  }
}
