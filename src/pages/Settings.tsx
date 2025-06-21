import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { 
  AccountBalanceWallet,
  Add,
  Delete,
  Save
} from "@mui/icons-material";
import { useWallet } from '../context/WalletContext';
import { getPhantomWallet } from '../utils/phantom';
import { uploadJSONToIPFS, uploadFileToIPFS } from "@/utils/pinata";
import { useProfile } from '../contexts/ProfileContext';
// Import Solana web3.js
import * as web3 from '@solana/web3.js';

// Initialize connection to Solana network (default to devnet if not specified)
const NETWORK = import.meta.env['VITE_SOLANA_NETWORK'] || 'devnet';
const connection = new web3.Connection(web3.clusterApiUrl(NETWORK as web3.Cluster));

// Get program ID from environment variables
const PROGRAM_ID_STRING = import.meta.env['VITE_SOLANA_PROGRAM_ID'];
let PROGRAM_ID: web3.PublicKey | null = null;

if (PROGRAM_ID_STRING) {
  try {
    PROGRAM_ID = new web3.PublicKey(PROGRAM_ID_STRING);
  } catch (error) {
    console.error('Invalid Solana program ID:', error);
  }
}

export default function Settings() {
  const { account } = useWallet();
  const { profile: savedProfile, updateProfile } = useProfile();
  const [profile, setProfile] = useState(savedProfile);
  const [newSkill, setNewSkill] = useState("");
  const [newPortfolioItem, setNewPortfolioItem] = useState({ name: "", link: "", rating: 5 });
  const [imagePreview, setImagePreview] = useState(savedProfile.profilePic);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  useEffect(() => {
    setProfile(savedProfile); // Sync local profile state when the context profile changes
    setImagePreview(savedProfile.profilePic); // Sync profile picture preview too
  }, [savedProfile]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      social: { ...prev.social, [name]: value }
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPortfolioItem(prev => ({
      ...prev,
      [name]: name === "rating" ? Number(value) : value
    }));
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.name.trim() && newPortfolioItem.link.trim()) {
      setProfile(prev => ({
        ...prev,
        portfolio: [...prev.portfolio, { ...newPortfolioItem }]
      }));
      setNewPortfolioItem({ name: "", link: "", rating: 5 });
    }
  };

  const removePortfolioItem = (itemName: string) => {
    setProfile(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter(item => item.name !== itemName)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      // Upload new profile image if changed
      let profilePicCID = profile.profilePic;
      if (imageFile) {
        // Add error handling and verification
        try {
          const imageCID = await uploadFileToIPFS(imageFile);
          
          // Verify CID is valid
          if (!imageCID) throw new Error('Image upload failed');
          
          // Use the gateway from environment variable
          const gateway = import.meta.env['VITE_PINATA_GATEWAY'] || 'ipfs.io';
          profilePicCID = `https://${gateway}/ipfs/${imageCID}`;
          
          // Verify the image exists
          const img = new Image();
          img.src = profilePicCID;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Image not found on IPFS'));
          });
        } catch (error) {
          console.error('Image upload verification failed:', error);
          throw error; // This will be caught by the outer try/catch
        }
      }
  
      // Create updated profile data
      const updatedProfile = {
        ...profile,
        profilePic: profilePicCID,
        wallet: account,
        lastUpdated: new Date().toISOString()
      };

      // Upload to IPFS and get CID
      const profileCid = await uploadJSONToIPFS(updatedProfile);
      console.log("Uploaded profile CID:", profileCid);

      if (!window.phantom?.solana) {
        throw new Error('Phantom wallet not connected');
      }

      // Connect to Phantom wallet
      const walletResponse = await window.phantom.solana.connect();
      const userPublicKey = new web3.PublicKey(walletResponse.publicKey.toString());
      
      if (!PROGRAM_ID) {
        throw new Error('Solana program ID not configured');
      }
      
      // Create an instruction to update the profile
      const profileInstruction = new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: userPublicKey, isSigner: true, isWritable: true },
          // Add other accounts your program needs (e.g., a profile account)
        ],
        data: Buffer.from(JSON.stringify({
          instruction: 'updateProfile',
          cid: profileCid
        }))
      });

      // Create transaction
      const profileTransaction = new web3.Transaction().add(profileInstruction);
      
      // Get recent blockhash and set the fee payer
      const { blockhash: recentBlockhash } = await connection.getRecentBlockhash();
      profileTransaction.recentBlockhash = recentBlockhash;
      profileTransaction.feePayer = userPublicKey;
      
      // Get the Phantom wallet instance
      const phantomWallet = getPhantomWallet();
      if (!phantomWallet) {
        throw new Error('Phantom wallet not found');
      }
      
      try {
        // Ensure we're connected
        const connectResponse = await phantomWallet.connect({ onlyIfTrusted: true });
        console.log('Connected to Phantom wallet:', connectResponse);
        
        // Sign the transaction
        console.log('Signing transaction...');
        const signedTx = await phantomWallet.signTransaction(profileTransaction);
        console.log('Transaction signed successfully');
        
        // Send the signed transaction
        console.log('Sending transaction...');
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        console.log('Transaction sent with signature:', signature);
        
        // Wait for confirmation
        console.log('Waiting for confirmation...');
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        console.log('Transaction confirmed:', confirmation);
        
        // Unpin old CID if it exists
        if (profile.lastCID) {
          try {
            const pinataJWT = import.meta.env['VITE_PINATA_JWT'];
            if (pinataJWT) {
              const options = {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${pinataJWT}`
                }
              };
              
              const unpinResponse = await fetch(`https://api.pinata.cloud/pinning/unpin/${profile.lastCID}`, options);
              
              if (unpinResponse.ok) {
                console.log("Previous CID unpinned successfully");
              } else {
                console.error("Failed to unpin CID:", await unpinResponse.text());
              }
            }
          } catch (unpinError) {
            console.error("Error during unpin request:", unpinError);
            // Continue with profile update even if unpinning fails
          }
        }
        
        // Update the profile state
        if (!account) {
          throw new Error('Wallet not connected');
        }
        
        updateProfile({
          ...updatedProfile,
          wallet: account, // Ensure wallet is set to the connected account
          lastCID: profileCid
        });

        return signature;
      } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return (
<div className="min-h-screen bg-gray-100">
<Header />
<div className="max-w-4xl mx-auto p-4">
<h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

<form onSubmit={handleSubmit} className="space-y-6">
{/* Profile Picture */}
<div className="bg-white p-6 rounded-lg shadow">
<h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
<div className="flex items-center space-x-6">
<div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
{imagePreview ? (
<img 
src={imagePreview} 
alt="Profile" 
className="w-full h-full object-cover"
/>
) : (
<div className="w-full h-full bg-gray-300 flex items-center justify-center">
<AccountBalanceWallet className="text-gray-500 text-2xl" />
</div>
)}
</div>
<div>
<input
type="file"
id="profile-pic"
accept="image/*"
onChange={handleImageChange}
className="hidden"
/>
<label
htmlFor="profile-pic"
className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
>
Change Photo
</label>
<p className="mt-2 text-sm text-gray-500">
JPG, GIF or PNG. Max size 2MB
</p>
</div>
</div>
</div>

{/* Basic Info */}
<div className="bg-white p-6 rounded-lg shadow">
<h2 className="text-lg font-semibold mb-4">Basic Information</h2>
<div className="space-y-6">
<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Name
<input
type="text"
name="name"
value={profile.name}
onChange={handleChange}
className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 mt-1"
required
/>
</label>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Bio
<textarea
name="bio"
value={profile.bio}
onChange={handleChange}
rows={3}
className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
/>
</label>
</div>

<div className="bg-gray-100 p-3 rounded-md">
<p className="text-sm text-gray-600">
<AccountBalanceWallet className="mr-2 inline" />
Wallet: {account || "Not connected"}
</p>
</div>
</div>
</div>

{/* Social Links */}
<div className="bg-white p-6 rounded-lg shadow">
<h2 className="text-lg font-semibold mb-4">Social Links</h2>
<div className="space-y-6">
{['github', 'linkedin', 'twitter'].map((platform) => (
<div key={platform}>
<label className="block text-sm font-medium text-gray-700 mb-1">
{platform.charAt(0).toUpperCase() + platform.slice(1)}
<input
type="url"
name={platform}
value={profile.social[platform as keyof typeof profile.social]}
onChange={handleSocialChange}
className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 mt-1"
/>
</label>
</div>
))}
</div>
</div>

{/* Skills */}
<div className="bg-white p-6 rounded-lg shadow">
<h2 className="text-lg font-semibold mb-4">Skills</h2>
<div className="flex flex-wrap gap-2 mb-4">
{profile.skills.map((skill) => (
<div key={skill} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full flex items-center">
{skill}
<button
type="button"
onClick={() => removeSkill(skill)}
className="ml-1 text-indigo-500 hover:text-indigo-700"
>
<Delete fontSize="small" />
</button>
</div>
))}
</div>
<div className="flex gap-2">
<input
type="text"
value={newSkill}
onChange={(e) => setNewSkill(e.target.value)}
placeholder="New skill"
className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
/>
<button
type="button"
onClick={addSkill}
className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
>
<Add className="mr-1" /> Add
</button>
</div>
</div>

{/* Portfolio */}
<div className="bg-white p-6 rounded-lg shadow">
<h2 className="text-lg font-semibold mb-4">Portfolio</h2>
<div className="space-y-6">
{profile.portfolio.map((project) => (
<div key={project.name} className="flex justify-between items-center border-b pb-2">
<div>
<p className="font-medium">{project.name}</p>
<a href={project.link} className="text-indigo-600 text-sm hover:underline">
View Project
</a>
</div>
<button
type="button"
onClick={() => removePortfolioItem(project.name)}
className="text-red-500 hover:text-red-700"
>
<Delete />
</button>
</div>
))}
<div className="space-y-3">
<input
type="text"
placeholder="Project Name"
name="name"
value={newPortfolioItem.name}
onChange={handlePortfolioChange}
className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
/>
<input
type="url"
placeholder="Project URL"
name="link"
value={newPortfolioItem.link}
onChange={handlePortfolioChange}
className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
/>
<button
type="button"
onClick={addPortfolioItem}
className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full"
>
<Add className="mr-1" /> Add Project
</button>
</div>
</div>
</div>

{/* Submit Button */}
<div className="flex justify-end">
<button
type="submit"
disabled={uploading}
className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${uploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
>
{uploading ? 'Saving...' : (
<>
<Save className="mr-2 h-5 w-5" />
Save Changes
</>
)}
</button>
</div>
</form>
</div>
</div>
);
}
