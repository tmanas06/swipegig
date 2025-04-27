// Create src/utils/ipfs.ts
export const convertIPFSURL = (url: string) => {
    if (url.startsWith('ipfs://')) {
      return `https://gateway.pinata.cloud/ipfs/${url.replace('ipfs://', '')}`;
    }
    return url;
  };
  