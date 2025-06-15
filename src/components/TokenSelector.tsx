import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  tags: string[];
}

export const TokenSelector = ({ onSelect }: { onSelect: (token: string) => void }) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [customToken, setCustomToken] = useState('');
  const [isValidCustom, setIsValidCustom] = useState(false);

  // Fetch verified tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(
          'https://lite-api.jup.ag/tokens/v1/tagged/verified'
        );
        const data = await response.json();
        setTokens(data);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };
    fetchTokens();
  }, []);

  // Debounced custom token validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (customToken.length > 0) {
        try {
          const response = await fetch(
            'https://lite-api.jup.ag/tokens/v1/mints/tradable'
          );
          const tradableTokens = await response.json();
          setIsValidCustom(tradableTokens.includes(customToken));
        } catch (error) {
          console.error('Validation failed:', error);
          setIsValidCustom(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customToken]);

  return (
    <div className="space-y-4">
      <Label>Payment Token</Label>
      <Select onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select payment token" />
        </SelectTrigger>
        <SelectContent>
          {/* Verified Tokens */}
          {tokens.map((token) => (
            <SelectItem key={token.address} value={token.address}>
              <div className="flex items-center gap-2">
                <img 
                  src={token.logoURI} 
                  alt={token.symbol}
                  className="w-5 h-5 rounded-full"
                  loading="lazy"
                />
                <span className="truncate">{token.symbol} - {token.name}</span>
              </div>
            </SelectItem>
          ))}
          {/* Custom Token Option */}
          <SelectItem value="custom">
            <div className="text-gray-400">
              Other (Enter custom token address)
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Token Input */}
      <Input
        placeholder="Enter custom token address"
        value={customToken}
        onChange={(e) => {
          setCustomToken(e.target.value);
          onSelect(e.target.value);
        }}
        className={!isValidCustom && customToken ? 'border-red-200' : ''}
      />

      {/* Validation Message */}
      {customToken && !isValidCustom && (
        <div className="text-sm text-red-500 p-2 bg-red-50 rounded-lg">
          ⚠️ This token is not supported by our payment system. 
          Only Jupiter-verified tokens can be used.
        </div>
      )}
    </div>
  );
};
