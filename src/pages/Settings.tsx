import React, { useState, useEffect } from "react";
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
  Add,
  Delete,
  Save
} from "@mui/icons-material";
import { useWallet } from "../context/WalletContext";
import { uploadJSONToIPFS, uploadFileToIPFS } from "@/utils/pinata";
import { useProfile } from '../contexts/ProfileContext';

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
     // In handleSubmit function, modify this section:
if (imageFile) {
    // Add error handling and verification
    try {
      const imageCID = await uploadFileToIPFS(imageFile);
      
      // Verify CID is valid
      if (!imageCID) throw new Error('Image upload failed');
      
      // Use YOUR gateway from environment variable
      profilePicCID = `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${imageCID}`;
      
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
      const cid = await uploadJSONToIPFS(updatedProfile);

      // Update global profile state
      updateProfile({
        ...updatedProfile,
        lastCID: cid
      });

    } catch (error) {
      console.error("Profile save failed:", error);
      alert("Error saving profile. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto pt-24 pb-8 px-4">
        <h1 className="text-2xl font-bold text-center mb-8">Edit Profile</h1>
        
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {/* Profile Image Section */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
            <div className="flex flex-col items-center gap-4">
              <img 
                src={imagePreview} 
                alt="Profile Preview" 
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
              />
              <label className="cursor-pointer bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition">
                Change Profile Picture
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 mt-1"
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
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 mt-1"
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

          {/* Social Links Section */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Social Links</h2>
            <div className="space-y-4">
              {['github', 'linkedin', 'twitter'].map((platform) => (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    <input
                      type="url"
                      name={platform}
                      value={profile.social[platform as keyof typeof profile.social]}
                      onChange={handleSocialChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 mt-1"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.skills.map((skill) => (
                <div key={skill} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 text-purple-500 hover:text-purple-700"
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
                className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={addSkill}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
              >
                <Add className="mr-1" /> Add
              </button>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
            <div className="space-y-4">
              {profile.portfolio.map((project) => (
                <div key={project.name} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <a href={project.link} className="text-purple-600 text-sm hover:underline">
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
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="url"
                  placeholder="Project URL"
                  name="link"
                  value={newPortfolioItem.link}
                  onChange={handlePortfolioChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={addPortfolioItem}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 w-full"
                >
                  <Add className="mr-1" /> Add Project
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={uploading}
              className={`bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition flex items-center text-lg ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <span className="mr-2 animate-spin">⟳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
