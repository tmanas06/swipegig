import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

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
}

export default function MyProfile() {
  const { account } = useWallet();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({
    name: "",
    bio: "",
    profilePic: "",
    wallet: account || "",
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
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!account) {
      console.log('No account connected, skipping profile fetch');
      setLoading(false);
      return;
    }

    console.log('Starting profile fetch for account:', account);
    setLoading(true);
    setError(null);

    try {
      // Check network connectivity first
      try {
        const networkCheck = await fetch('https://cloudflare-dns.com/dns-query', {
          method: 'GET',
          headers: { 'accept': 'application/dns-json' }
        });
        console.log('Network connectivity check:', networkCheck.ok ? 'OK' : 'Failed');
      } catch (networkError) {
        console.error('Network error:', networkError);
        throw new Error('NETWORK_ERROR');
      }

      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('Connected to network:', {
        name: network.name,
        chainId: network.chainId,
        // Remove ensAddress as it's not available on all networks
      });

      // Get contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS.toLowerCase(),
        Web3WorkProfilesABI,
        provider
      );

      console.log('Contract instance created:', {
        address: CONTRACT_ADDRESS,
        network: network.name,
        account
      });

      // Check if profile exists
      console.log('Checking if profile exists...');
      let hasProfile = false;
      try {
        hasProfile = await contract.hasProfile(account);
        console.log('Profile exists check:', hasProfile);
      } catch (error) {
        console.error('Error checking if profile exists:', error);
        // Continue to try getting the CID anyway, as some contracts might not have hasProfile
      }

      // Get profile CID
      console.log('Fetching profile CID...');
      let cid;
      try {
        cid = await contract.getProfileCID(account);
        console.log('Raw CID from contract:', cid);

        if (!cid || cid === '0x' || cid === '') {
          console.error('Empty or invalid CID received from contract');
          throw new Error('PROFILE_NOT_FOUND');
        }
      } catch (error) {
        console.error('Error fetching profile CID:', error);
        if (!hasProfile) {
          throw new Error('PROFILE_NOT_FOUND');
        }
        throw error;
      }

      // Convert CID to URL and fetch profile
      const profileUrl = convertIPFSURL(cid);
      console.log('Fetching profile from URL:', profileUrl);

      const response = await fetch(profileUrl, {
        headers: { 'Cache-Control': 'no-cache' },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        console.error('Failed to fetch profile:', {
          status: response.status,
          statusText: response.statusText,
          url: profileUrl
        });
        throw new Error('PROFILE_FETCH_ERROR');
      }

      const text = await response.text();
      console.log('Raw profile response:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));

      if (text.startsWith('<!DOCTYPE') || text.trim() === '') {
        console.error('Received HTML instead of JSON, likely a gateway error');
        throw new Error('PROFILE_FETCH_ERROR');
      }

      let profileData;
      try {
        profileData = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse profile JSON:', parseError);
        throw new Error('PROFILE_PARSE_ERROR');
      }

      console.log('Profile data loaded successfully:', {
        name: profileData.name,
        title: profileData.title,
        skills: profileData.skills?.length || 0,
        portfolio: profileData.portfolio?.length || 0,
        reviews: profileData.reviews?.length || 0
      });

      setProfile(prev => ({
        ...prev,
        ...profileData,
        wallet: account,
        // Add default values for any missing required fields
        name: profileData.name || 'Anonymous',
        title: profileData.title || 'Blockchain Professional',
        bio: profileData.bio || 'No bio available',
        skills: profileData.skills || [],
        portfolio: profileData.portfolio || [],
        reviews: profileData.reviews || []
      }));

    } catch (err) {
      const error = err as Error & { code?: string | number };
      console.error('Error in fetchProfile:', error);
      
      if (error.message === 'PROFILE_NOT_FOUND' || error.message.includes('profile not found')) {
        console.log('Profile not found, navigating to create profile');
        setError('PROFILE_NOT_FOUND');
      } else if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('network')) {
        console.error('Network request timed out');
        setError('NETWORK_ERROR');
      } else if (error.message.includes('PROFILE_FETCH_ERROR')) {
        setError('PROFILE_FETCH_ERROR');
      } else if (error.message.includes('PROFILE_PARSE_ERROR')) {
        setError('PROFILE_PARSE_ERROR');
      } else if (error.message.includes('user rejected') || error.message.includes('denied')) {
        setError('USER_REJECTED');
      } else if (error.message.includes('insufficient funds')) {
        setError('INSUFFICIENT_FUNDS');
      } else if (error.code === 'NETWORK_ERROR' || error.code === 'NETWORK_UPDATE_REQUIRED') {
        setError('NETWORK_ERROR');
      } else if (error.code === -32002) {
        setError('PENDING_REQUEST');
      } else {
        console.error('Unexpected error:', error);
        setError('UNKNOWN_ERROR');
      }
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error === 'PROFILE_NOT_FOUND') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            You don't have a profile yet. Would you like to create one?
          </p>
          <Button 
            onClick={() => navigate('/register')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Create Profile
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">
            {error === 'NETWORK_ERROR' 
              ? 'Network error occurred. Please try again later.' 
              : 'Failed to load profile. Please try again.'}
          </p>
          <Button 
            onClick={fetchProfile}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <AccountBalanceWallet className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  {`${profile.wallet.substring(0, 6)}...${profile.wallet.substring(38)}`}
                </div>
                {profile.verified && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <VerifiedUser className="flex-shrink-0 mr-1.5 h-5 w-5" />
                    Verified
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button
                type="button"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-purple-700 to-purple-500 h-32 relative">
                {profile.profilePic && (
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                    <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden">
                      <img
                        className="h-full w-full object-cover"
                        src={profile.profilePic}
                        alt="Profile"
                      />
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="pt-20 text-center">
                <h2 className="text-xl font-semibold">{profile.name}</h2>
                {profile.bio && (
                  <p className="mt-2 text-gray-600">{profile.bio}</p>
                )}
                
                {/* Social Links */}
                <div className="flex justify-center space-x-4 mt-4">
                  {profile.social?.github && (
                    <a 
                      href={`https://github.com/${profile.social.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <GitHub />
                    </a>
                  )}
                  {profile.social?.twitter && (
                    <a 
                      href={`https://twitter.com/${profile.social.twitter}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-500"
                    >
                      <Twitter />
                    </a>
                  )}
                  {profile.social?.linkedin && (
                    <a 
                      href={profile.social.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-700"
                    >
                      <LinkedIn />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.length > 0 ? (
                    profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.bio ? (
                  <p className="text-gray-700">{profile.bio}</p>
                ) : (
                  <p className="text-gray-500">No bio available</p>
                )}
              </CardContent>
            </Card>

            {/* Reputation & Credentials */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Reputation */}
              <Card>
                <CardHeader>
                  <CardTitle>Reputation Score</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.reputation ? (
                    <>
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex flex-col items-center">
                          <span className="text-4xl font-bold text-purple-600">
                            {profile.reputation.score || 0}
                          </span>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                fontSize="small"
                                className={i < Math.round(profile.reputation?.score || 0) ? "text-purple-500" : "text-gray-300"}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-gray-600 text-sm">
                          Based on {profile.reputation.jobs || 0} completed jobs
                        </span>
                      </div>
                      
                      {profile.reputation.breakdown?.length > 0 && (
                        <div className="space-y-2 mt-4">
                          {profile.reputation.breakdown.map((item, index) => (
                            <div key={index} className="mb-2">
                              <div className="flex justify-between text-sm mb-1">
                                <span>{item.label}</span>
                                <span className="font-semibold">{item.value}</span>
                              </div>
                              <div className="w-full h-2 bg-purple-100 rounded overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500 rounded" 
                                  style={{ width: `${Math.min(100, (item.value / 5) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">No reputation data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Credentials */}
              <Card>
                <CardHeader>
                  <CardTitle>Credentials</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* DID */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">DID</h3>
                      <p className="mt-1 text-sm text-gray-900 break-all">
                        {profile.did || 'Not available'}
                      </p>
                    </div>

                    {/* Gitcoin Stamps */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Gitcoin Stamps</h3>
                      <div className="mt-1 flex items-center">
                        <Shield className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-900">
                          {profile.gitcoinStamps || 0} Stamps
                        </span>
                      </div>
                    </div>

                    {/* Lens Protocol */}
                    {profile.lens && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Lens Protocol</h3>
                        <div className="mt-1">
                          <a
                            href={`https://lenster.xyz/u/${profile.lens}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:underline"
                          >
                            @{profile.lens}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Portfolio</CardTitle>
                  <Button variant="outline" size="sm">
                    Add Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {profile.portfolio?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {profile.portfolio.map((project, index) => (
                      <div 
                        key={index}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{project.name}</h3>
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:underline"
                            >
                              View Project
                            </a>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                fontSize="small"
                                className={i < Math.round(project.rating) ? "text-yellow-400" : "text-gray-300"}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No portfolio projects added yet</p>
                    <Button variant="outline" className="mt-4">
                      Add Your First Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Client Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {profile.reviews.map((review, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{review.client}</h4>
                            <p className="text-sm text-gray-500">{review.date}</p>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                fontSize="small"
                                className={i < 5 ? "text-yellow-400" : "text-gray-300"}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}