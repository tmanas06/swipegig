// src/pages/MyProfile.tsx
import React, { useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useProfile } from '../contexts/ProfileContext';
import { formatNumber } from '../utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const MyProfile: React.FC = () => {
  const { account } = useWallet();
  const { tokenBalances, nfts, loading, error, refreshBalances } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (account) {
      refreshBalances(account);
    }
  }, [account, refreshBalances]);

  if (!account) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Wallet not connected</h2>
          <p className="text-gray-500">Please connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppBar position="static" color="default" elevation={1} className="bg-white dark:bg-gray-800">
        <Container maxWidth="lg">
          <Toolbar className="px-0">
            <Button 
              startIcon={<ArrowBackIosIcon />} 
              onClick={() => navigate(-1)}
              sx={{ mr: 2 }}
              className="text-gray-700 dark:text-gray-200"
            >
              Back
            </Button>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} className="text-gray-800 dark:text-white">
              My Profile
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" className="py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Wallet Address</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono break-all text-gray-800 dark:text-gray-200">
            {account}
          </div>
        </div>

        {/* Rest of your existing content */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Token Balances</h2>
            <button
              onClick={() => refreshBalances(account)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading && !tokenBalances.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : tokenBalances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokenBalances.map((token) => (
                <Card key={token.mint} className="hover:shadow-lg transition-shadow dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      {token.logoURI ? (
                        <img
                          src={token.logoURI}
                          alt={token.symbol}
                          className="h-10 w-10 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs dark:text-gray-300">TOKEN</span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium dark:text-white">{token.symbol || 'Unknown'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(token.uiAmount)} {token.symbol}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No token balances found
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">NFTs</h2>
          {loading && !nfts.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : nfts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {nfts.map((nft) => (
                <Card key={nft.mint} className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-gray-800">
                  {nft.image ? (
                    <img
                      src={nft.image}
                      alt={nft.name || 'NFT'}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200';
                      }}
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">No image</span>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-medium truncate dark:text-white">{nft.name || 'Unnamed NFT'}</h3>
                    {nft.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{nft.description}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No NFTs found in this wallet
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default MyProfile;