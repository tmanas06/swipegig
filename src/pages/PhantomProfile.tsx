import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Wallet } from 'lucide-react';
import { connectPhantom, disconnectPhantom, isPhantomInstalled } from '@/utils/phantom';

export default function PhantomProfile() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [network, setNetwork] = useState<string>('');

  // Check if Phantom is installed on component mount
  useEffect(() => {
    const checkPhantom = async () => {
      if (isPhantomInstalled()) {
        const provider = window.phantom?.solana;
        if (provider?.isConnected) {
          const publicKey = provider.publicKey?.toString();
          if (publicKey) {
            setWalletAddress(publicKey);
            // In a real app, you would fetch the balance and network here
            fetchWalletInfo(publicKey);
          }
        }
      }
    };

    checkPhantom();

    // Set up event listeners
    const handleConnect = (publicKey: { toString: () => string }) => {
      setWalletAddress(publicKey.toString());
      fetchWalletInfo(publicKey.toString());
    };

    const handleDisconnect = () => {
      setWalletAddress(null);
      setBalance('0');
      setNetwork('');
    };

    // Add event listeners
    const phantom = window.phantom?.solana;
    if (phantom) {
      phantom.on('connect', handleConnect);
      phantom.on('disconnect', handleDisconnect);
    }

    return () => {
      // Clean up event listeners
      if (phantom) {
        phantom.off('connect', handleConnect);
        phantom.off('disconnect', handleDisconnect);
      }
    };
  }, []);

  const fetchWalletInfo = async (publicKey: string) => {
    try {
      // In a real app, you would fetch actual balance and network info
      // This is a placeholder implementation
      setBalance('1.5');
      setNetwork('Solana Devnet');
    } catch (error) {
      console.error('Error fetching wallet info:', error);
    }
  };

  const handleConnect = async () => {
    if (!isPhantomInstalled()) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const publicKey = await connectPhantom();
      if (publicKey) {
        setWalletAddress(publicKey);
        fetchWalletInfo(publicKey);
      }
    } catch (error) {
      console.error('Failed to connect to Phantom:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectPhantom();
      setWalletAddress(null);
      setBalance('0');
      setNetwork('');
    } catch (error) {
      console.error('Failed to disconnect from Phantom:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Phantom Wallet Profile</CardTitle>
            {walletAddress ? (
              <Badge variant="outline" className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                Disconnected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {walletAddress ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`} />
                  <AvatarFallback>PH</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">Phantom Wallet</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4 mr-1" />
                    {formatAddress(walletAddress)}
                    <a
                      href={`https://explorer.solana.com/address/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-500 hover:underline flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Explorer
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Balance</p>
                  <p className="text-xl font-semibold">{balance} SOL</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Network</p>
                  <p className="text-xl font-semibold">{network || 'Not connected'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
                <div className="flex items-center">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono break-all">
                    {walletAddress}
                  </code>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect Your Phantom Wallet</h3>
              <p className="text-muted-foreground mb-6">Connect your Phantom wallet to view your profile and manage your assets.</p>
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isConnecting ? 'Connecting...' : 'Connect Phantom Wallet'}
              </Button>
              {!isPhantomInstalled() && (
                <p className="text-sm text-muted-foreground mt-4">
                  Don't have Phantom?{' '}
                  <a 
                    href="https://phantom.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    Install Extension
                  </a>
                </p>
              )}
            </div>
          )}
        </CardContent>

        {walletAddress && (
          <CardFooter className="border-t pt-4 justify-end">
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              disabled={isConnecting}
            >
              Disconnect Wallet
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
