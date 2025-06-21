// Update the imports at the top
import axios from 'axios';

const JUPITER_ULTRA_API = 'https://lite-api.jup.ag/ultra/v1';

export interface TokenBalance {
  mint: string;
  amount: string;
  uiAmount: number;
  decimals: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
}

export interface NFT {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// Get token balances using Jupiter Ultra API
export const getTokenBalances = async (address: string): Promise<TokenBalance[]> => {
  try {
    // First get the balances from Jupiter Ultra API
    const response = await axios.get(`${JUPITER_ULTRA_API}/balances/${address}`);
    const balances = response.data;

    // Get token metadata from Jupiter token list
    const tokenListResponse = await axios.get('https://token.jup.ag/strict');
    const tokenList = tokenListResponse.data;

    // Transform the balances to match our TokenBalance interface
    return Object.entries(balances).map(([mint, balanceData]: [string, any]) => {
      const tokenInfo = tokenList.find((t: any) => t.address === mint);
      
      return {
        mint,
        amount: balanceData.amount,
        uiAmount: balanceData.uiAmount,
        decimals: tokenInfo?.decimals || 9, // Default to 9 decimals for unknown tokens
        symbol: tokenInfo?.symbol || 'Unknown',
        name: tokenInfo?.name || 'Unknown Token',
        logoURI: tokenInfo?.logoURI,
      };
    });
  } catch (error: any) {
    console.error('Error fetching token balances:', error);
    if (error.response?.data?.error === 'Invalid address') {
      throw new Error('Invalid Solana address provided');
    }
    throw new Error('Failed to fetch token balances. Please try again later.');
  }
};

// Get NFTs using Jupiter Ultra API
// Add this constant at the top with other constants
const HELIUS_API_KEY = 'c891a451-5cda-4992-a415-7c2b2ef30109'; // You'll need to get this from helius.xyz

// Update the getNFTs function
export const getNFTs = async (address: string): Promise<NFT[]> => {
  try {
    const response = await axios.post('https://mainnet.helius-rpc.com', {
      jsonrpc: '2.0',
      id: 'my-nft-fetch',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: address,
        page: 1,
        limit: 20,
        displayOptions: {
          showUnverifiedCollections: false,
          showCollectionMetadata: true
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.data?.result?.items) {
      return [];
    }

    return response.data.result.items
      .filter((item: any) => 
        item.compression?.owned && 
        item.content?.metadata && 
        item.content.metadata.name
      )
      .map((item: any) => {
        // Handle both compressed and regular NFTs
        const metadata = item.content?.metadata || {};
        const image = item.content?.links?.image || 
                     metadata.image || 
                     'https://via.placeholder.com/200x200?text=NFT+Image+Not+Available';
        
        return {
          mint: item.id,
          name: metadata.name || 'Unnamed NFT',
          symbol: metadata.symbol || 'NFT',
          image,
          description: metadata.description,
          attributes: metadata.attributes?.map((attr: any) => ({
            trait_type: attr.trait_type,
            value: attr.value
          })) || []
        };
      });
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};