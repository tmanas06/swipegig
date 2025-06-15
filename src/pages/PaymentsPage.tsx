/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/PaymentsPage.tsx
import { useEffect, useState } from 'react';
import { UnifiedWalletProvider, UnifiedWalletButton, useWallet } from '@jup-ag/wallet-adapter';
import { Connection, VersionedTransaction } from '@solana/web3.js';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

const PaymentInterface = () => {
  const { publicKey, signTransaction } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const connection = new Connection('https://api.mainnet-beta.solana.com');

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('https://lite-api.jup.ag/tokens/v1/tagged/verified');
        const tokenData = await response.json();
        setTokens(tokenData);
        const sol = tokenData.find((t: Token) => t.symbol === 'SOL');
        const usdc = tokenData.find((t: Token) => t.symbol === 'USDC');
        if (sol) setInputToken(sol);
        if (usdc) setOutputToken(usdc);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };
    fetchTokens();
  }, []);

  useEffect(() => {
    const getQuote = async () => {
      if (!inputToken || !outputToken || !inputAmount || Number(inputAmount) <= 0) {
        setQuote(null);
        setOutputAmount('');
        return;
      }
      try {
        setLoading(true);
        const amount = Math.floor(Number(inputAmount) * Math.pow(10, inputToken.decimals));
        const response = await fetch(
          `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputToken.address}&outputMint=${outputToken.address}&amount=${amount}&slippageBps=50`
        );
        const quoteData = await response.json();
        if (quoteData.outAmount) {
          setQuote(quoteData);
          setOutputAmount((Number(quoteData.outAmount) / Math.pow(10, outputToken.decimals)).toFixed(6));
        }
      } catch (error) {
        console.error('Error getting quote:', error);
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(getQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [inputAmount, inputToken, outputToken]);

  const executeSwap = async () => {
    if (!publicKey || !signTransaction || !quote) return;
    try {
      setLoading(true);
      const swapResponse = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 1000000,
              priorityLevel: "veryHigh"
            }
          }
        }),
      });
      const { swapTransaction } = await swapResponse.json();
      const transactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(transactionBuf);
      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: true,
        maxRetries: 2
      });
      await connection.confirmTransaction(signature);
      alert(`Swap successful! https://solscan.io/tx/${signature}`);
      setInputAmount('');
      setOutputAmount('');
      setQuote(null);
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0e17] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-[#7afcff33] to-[#6366f133] rounded-full -top-32 -left-32 blur-3xl animate-pulse"></div>
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-[#6366f133] to-[#7afcff33] rounded-full -bottom-32 -right-32 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <header className="w-full flex justify-between items-center px-8 py-6 mb-12 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-[#7afcff] to-[#6366f1] rounded-lg"></div>
          <div className="text-2xl font-bold bg-gradient-to-r from-[#7afcff] to-[#6366f1] bg-clip-text text-transparent">
            Swipegig
          </div>
        </div>
        <UnifiedWalletButton 
          buttonClassName="!bg-[#1f2937] !text-[#7afcff] !px-6 !py-3 !rounded-xl 
                   hover:!bg-[#2d3748] transition-colors !border !border-[#7afcff33]"
        />
      </header>

      <main className="w-full flex flex-col items-center z-10">
        <div className="bg-[#1a2230]/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md 
                        border border-[#7afcff]/10 relative overflow-hidden">
          {/* Decorative border gradient */}
          <div className="absolute inset-0 rounded-3xl p-px bg-gradient-to-r from-[#7afcff33] to-[#6366f133] -z-10">
            <div className="absolute inset-0 bg-[#1a2230]/90 backdrop-blur-xl"></div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#7afcff] font-bold text-2xl mb-2">Instant Swap</span>
              <p className="text-[#9ca3af] text-sm text-center">
                Swap any token directly from your wallet. Low fees, instant settlement.
              </p>
            </div>

            {/* Input Section */}
            <div className="space-y-4">
              <div className="bg-[#0a0e17] rounded-xl p-4 border border-[#7afcff]/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#7afcff] text-sm font-medium">You pay</span>
                  <span className="text-[#9ca3af] text-xs">Balance: --</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={inputToken?.logoURI} 
                      className="w-8 h-8 rounded-full border-2 border-[#7afcff]/20"
                      onError={(e) => (e.currentTarget.src = '/placeholder-token.svg')}
                    />
                    <select
                      value={inputToken?.address || ''}
                      onChange={e => setInputToken(tokens.find(t => t.address === e.target.value) || null)}
                      className="bg-transparent text-[#f3f4f6] font-medium cursor-pointer hover:bg-[#1a2230]/50 rounded-lg px-2 py-1"
                    >
                      {tokens.map(token => (
                        <option key={token.address} value={token.address} className="bg-[#1a2230]">
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={e => setInputAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-right text-lg text-[#f3f4f6] w-32 placeholder-[#4b5563] 
                             focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Swap Icon */}
              <div className="flex justify-center -my-3 z-10">
                <div className="p-2 bg-[#0a0e17] border border-[#7afcff]/10 rounded-full">
                  <svg className="w-6 h-6 text-[#7afcff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                  </svg>
                </div>
              </div>

              {/* Output Section */}
              <div className="bg-[#0a0e17] rounded-xl p-4 border border-[#7afcff]/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#7afcff] text-sm font-medium">You receive</span>
                  <span className="text-[#9ca3af] text-xs">Balance: --</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={outputToken?.logoURI}
                      className="w-8 h-8 rounded-full border-2 border-[#7afcff]/20"
                      onError={(e) => (e.currentTarget.src = '/placeholder-token.svg')}
                    />
                    <select
                      value={outputToken?.address || ''}
                      onChange={e => setOutputToken(tokens.find(t => t.address === e.target.value) || null)}
                      className="bg-transparent text-[#f3f4f6] font-medium cursor-pointer hover:bg-[#1a2230]/50 rounded-lg px-2 py-1"
                    >
                      {tokens.map(token => (
                        <option key={token.address} value={token.address} className="bg-[#1a2230]">
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={loading ? '...' : outputAmount}
                    readOnly
                    className="bg-transparent text-right text-lg text-[#f3f4f6] w-32 placeholder-[#4b5563] 
                             focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Price Info */}
            {quote && (
  <div className="mt-4 bg-[#232c3d] rounded-lg px-4 py-3 text-[#b3c2d6] text-xs flex flex-col gap-2 border border-[#2a3346]">
    <div className="flex justify-between">
      <span>Price Impact</span>
      <span className="text-[#7afcff] font-semibold">
        {Number(quote.priceImpactPct).toFixed(2)}%
      </span>
    </div>
    <div className="flex justify-between">
      <span>Slippage</span>
      <span className="text-[#7afcff] font-semibold">0.5%</span>
    </div>
    {quote.price && (
      <div className="flex justify-between">
        <span>Price</span>
        <span className="text-[#7afcff] font-semibold">
          {Number(quote.price).toPrecision(6)}
        </span>
      </div>
    )}
  </div>
)}


            <button
              onClick={executeSwap}
              disabled={!publicKey || !quote || loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all
                ${!publicKey || !quote || loading 
                  ? 'bg-[#2d3748] text-[#7afcff] opacity-50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#7afcff] to-[#6366f1] text-[#0a0e17] hover:shadow-[0_0_20px_-5px_#7afcff]'
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current rounded-full animate-spin border-t-transparent"></div>
                  Swapping...
                </div>
              ) : !publicKey ? (
                'Connect Wallet to Swap'
              ) : (
                'Swap Now'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function PaymentsPage() {
  return (
    <UnifiedWalletProvider
      wallets={[]}
      config={{
        autoConnect: false,
        env: 'mainnet-beta',
        metadata: {
          name: 'Swipegig Payments',
          description: 'Crypto Payments',
          url: window.location.href,
          iconUrls: ['/favicon.ico'],
        },
      }}
    >
      <PaymentInterface />
    </UnifiedWalletProvider>
  );
}
