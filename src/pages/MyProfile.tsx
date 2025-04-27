import React,  { useState, useEffect }  from "react";
import { Header } from "@/components/Header";
import {
  Shield,
  VerifiedUser,
  Star,
  AccountBalanceWallet,
  Tag,
  GitHub,
  LinkedIn,
  Twitter,
} from "@mui/icons-material";
import { useWallet } from "../context/WalletContext";
import { ethers } from "ethers";
import Web3WorkProfilesABI from '../contracts/IpcmAbi.json';
import { convertIPFSURL } from "../utils/ipfs";
import { Navigate } from "react-router-dom";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;


export default function MyProfile() {
  const { account } = useWallet();
  interface Profile {
    name: string;
    bio: string;
    profilePic: string;
    wallet: string;
    did: string;
    verified: boolean;
    social: {
      github: string;
      linkedin: string;
      twitter: string;
    };
    reputation: {
      score: number;
      jobs: number;
      breakdown: { label: string; value: number }[];
    };
    lens: string;
    skillNFTs: string[];
    gitcoinStamps: number;
    skills: string[];
    portfolio: { name: string; link: string; rating: number }[];
    reviews: { client: string; date: string; comment: string }[];
    lastCID?: string;
  }

  const [profile, setProfile] = useState<Profile>({
    name: "",
    bio: "",
    profilePic: "",
    wallet: "",
    did: "",
    verified: false,
    social: {
      github: "",
      linkedin: "",
      twitter: "",
    },
    reputation: {
      score: 0,
      jobs: 0,
      breakdown: [],
    },
    lens: "",
    skillNFTs: [],
    gitcoinStamps: 0,
    skills: [],
    portfolio: [],
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // In MyProfile.tsx's useEffect
const fetchProfile = async () => {
  if (!account) {
    setLoading(false);
    return;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS.toLowerCase(),
      Web3WorkProfilesABI,
      provider
    );

    // 1. Verify CID exists
    const cid = await contract.getProfileCID(account);
    if (!cid || cid.startsWith("<")) { // Basic HTML check
      throw new Error("Invalid CID from contract");
    }

    // 2. Debugging: Log the CID and URL
    console.log("Fetching profile CID:", cid);
    const url = convertIPFSURL(cid);
    console.log("Fetching from URL:", url);

    // 3. Fetch and verify response
    const response = await fetch(url);
    const text = await response.text();
    
    if (!response.ok || text.startsWith("<!DOCTYPE")) {
      throw new Error(`IPFS fetch failed: ${text.slice(0, 50)}...`);
    }

    // 4. Parse JSON
    const profileData = JSON.parse(text);
    setProfile(profileData);

  } catch (err) {
    console.error("Error:", err);
  
  // Check for contract revert with "Profile not registered" message
  if (err.toString().includes("Profile not registered")) {
    // Use Navigate component instead of window.location for React Router
    setError("PROFILE_NOT_FOUND");
    return;
  }
  
  setError(err instanceof Error ? err.message : "Failed to load profile");
  } finally {
    setLoading(false);
  }
};


    fetchProfile();
  }, [account]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

 // Update the error display section
if (error) {
  if (error === "PROFILE_NOT_FOUND") {
    return <Navigate to="/register" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <div className="text-red-500 text-lg">{error}</div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto pt-24 pb-8 px-4">
        <main className="max-w-3xl mx-auto p-4">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center gap-6 bg-white rounded-2xl shadow p-6 mb-6">
          <img
  src={profile.profilePic}
  alt={profile.name}
  className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
/>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {profile.verified && (
                  <span className="ml-1" title="Verified Profile">
                    <Shield className="text-purple-500" fontSize="small" />
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{profile.bio}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-800">
                  <AccountBalanceWallet fontSize="inherit" className="mr-1" />
                  {profile.wallet}
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-800">
                  <VerifiedUser fontSize="inherit" className="mr-1" />
                  {profile.did}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <a href={profile.social.github} target="_blank" rel="noopener noreferrer">
                  <GitHub fontSize="small" className="text-gray-500 hover:text-purple-500" />
                </a>
                <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer">
                  <LinkedIn fontSize="small" className="text-gray-500 hover:text-purple-500" />
                </a>
                <a href={profile.social.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter fontSize="small" className="text-gray-500 hover:text-purple-500" />
                </a>
              </div>
            </div>
          </div>

          {/* Reputation & Credentials */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Reputation */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Reputation Score</h2>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-bold text-purple-600">{profile.reputation.score}</span>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        fontSize="small"
                        className={i < Math.round(profile.reputation.score) ? "text-purple-500" : "text-gray-300"}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-gray-600 text-sm">
                  Based on {profile.reputation.jobs} completed jobs
                </span>
              </div>
              <div className="space-y-2 mt-4">
                {profile.reputation.breakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    <div className="w-full h-2 bg-purple-100 rounded">
                      <div
                        className="h-2 bg-purple-500 rounded"
                        style={{ width: `${(item.value / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credentials */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Web3 Credentials</h2>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Shield className="text-purple-400" />
                  <span>
                    <span className="font-medium">Verified DID</span>
                    <br />
                    <span className="text-xs text-gray-500">{profile.did}</span>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Tag className="text-purple-400" />
                  <span>
                    <span className="font-medium">Lens Protocol Verification</span>
                    <br />
                    <span className="text-xs text-gray-500">{profile.lens}</span>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <VerifiedUser className="text-purple-400" />
                  <span>
                    <span className="font-medium">Skill NFTs</span>
                    <br />
                    <span className="text-xs text-gray-500">
                      {profile.skillNFTs.length} verified skill credentials
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="text-purple-400" />
                  <span>
                    <span className="font-medium">Gitcoin Passport</span>
                    <br />
                    <span className="text-xs text-gray-500">
                      {profile.gitcoinStamps} stamps verified
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Skills / Services Offered</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
            <ul className="space-y-2">
              {profile.portfolio.map((proj) => (
                <li key={proj.name} className="flex items-center gap-3">
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-700 font-medium hover:underline"
                  >
                    {proj.name}
                  </a>
                  <Star className="text-purple-500" fontSize="small" />
                  <span className="font-semibold text-gray-700">{proj.rating}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Reviews</h2>
            <ul className="divide-y divide-gray-100">
              {profile.reviews.map((review, idx) => (
                <li key={idx} className="py-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{review.client}</span>
                    <span className="text-xs text-gray-400">{review.date}</span>
                  </div>
                  <p className="text-gray-600 mt-1">"{review.comment}"</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Show CID if available */}
          {profile.lastCID && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Profile CID: <span className="font-mono">{profile.lastCID}</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
