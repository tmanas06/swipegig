// src/contexts/ProfileContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Define profile data structure based on your current static data
interface ProfileData {
  name: string;
  bio: string;
  profilePic: string;
  wallet: string;
  did: string;
  lens: string;
  gitcoinStamps: number;
  skillNFTs: string[];
  verified: boolean;
  social: {
    github: string;
    linkedin: string;
    twitter: string;
  };
  skills: string[];
  reputation: {
    score: number;
    jobs: number;
    breakdown: Array<{ label: string; value: number }>;
  };
  portfolio: Array<{ name: string; link: string; rating: number }>;
  reviews: Array<{ client: string; comment: string; date: string }>;
  lastCID?: string; // Track the latest IPFS CID
}

// Default profile matches your static data
const defaultProfile: ProfileData = {
  name: "Jane Doe",
  bio: "Smart Contract Developer | DeFi Enthusiast | Building trustless systems.",
  profilePic: "https://randomuser.me/api/portraits/women/65.jpg",
  wallet: "0x08fd...6a19",
  did: "did:ethr:0x1a2b3c...",
  lens: "@web3dev.lens",
  gitcoinStamps: 24,
  skillNFTs: ["Solidity", "Auditing", "React"],
  verified: true,
  social: {
    github: "https://github.com/janedoe",
    linkedin: "https://linkedin.com/in/janedoe",
    twitter: "https://twitter.com/janedoe",
  },
  skills: ["Solidity Developer", "Smart Contract Auditor", "Frontend Web3 Dev"],
  reputation: {
    score: 4.8,
    jobs: 12,
    breakdown: [
      { label: "Communication", value: 4.9 },
      { label: "Quality of Work", value: 5.0 },
      { label: "Timeliness", value: 4.7 },
      { label: "Code Quality", value: 4.8 },
    ],
  },
  portfolio: [
    { name: "Uniswap Audit", link: "#", rating: 5 },
    { name: "NFT Mint Site", link: "#", rating: 4.8 },
  ],
  reviews: [
    { client: "Alice", comment: "Great work, fast delivery", date: "2025-03-14" },
    { client: "Bob", comment: "Expert in smart contracts", date: "2025-02-20" },
  ],
};

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (newProfile: ProfileData) => void;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: defaultProfile,
  updateProfile: () => {},
  loading: false,
});

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(false);

  // Load saved profile on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('profileData');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Error loading saved profile', error);
      }
    }
  }, []);

  const updateProfile = (newProfile: ProfileData) => {
    setProfile(newProfile);
    localStorage.setItem('profileData', JSON.stringify(newProfile));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
