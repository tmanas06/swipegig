// src/utils/ipfs.ts
export const convertIPFSURL = (input: string): string => {
  if (!input) return '';
  
  // Use Pinata gateway from environment variables if available, otherwise use public gateway
  const gateway = import.meta.env.VITE_PINATA_GATEWAY || 'ipfs.io';
  
  try {
    // Extract CID regardless of input format
    let cid = input.trim();
    
    // Handle different IPFS URL formats
    if (cid.startsWith('ipfs://')) {
      cid = cid.replace('ipfs://', '');
    } else if (cid.startsWith('https://ipfs.io/ipfs/')) {
      cid = cid.replace('https://ipfs.io/ipfs/', '');
    } else if (cid.includes('/ipfs/')) {
      cid = cid.split('/ipfs/')[1];
    }
    
    // Remove any trailing slashes or query parameters
    cid = cid.split('?')[0].split('#')[0];
    
    if (!cid) {
      console.error('Invalid IPFS CID:', input);
      return '';
    }
    
    // Construct the gateway URL
    const url = `https://${gateway}/ipfs/${cid}`;
    console.log('Converted IPFS URL:', { input, cid, gateway, url });
    return url;
    
  } catch (error) {
    console.error('Error converting IPFS URL:', { input, error });
    return '';
  }
};
