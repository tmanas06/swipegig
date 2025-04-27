import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useProfile } from '../contexts/ProfileContext';
import { uploadJSONToIPFS } from '@/utils/pinata';
import { ethers } from 'ethers';
import Web3WorkJobsABI from '../contracts/JobsAbi.json';
import { uploadFileToIPFS } from '@/utils/pinata';
import Groq from "groq-sdk";

const CONTRACT_ADDRESS = import.meta.env.VITE_JOBS_CONTRACT_ADDRESS;

interface FormState {
  companyName: string;
  website: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetMin: number;
  budgetMax: number;
  duration: string;
  location: 'remote' | 'onsite' | 'hybrid';
  immediate: boolean;
}

const PostJob = () => {
  const navigate = useNavigate();
  const { account } = useWallet();
  const { profile } = useProfile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAIAssisted, setIsAIAssisted] = useState(true);
  const [skill, setSkill] = useState<string>('');
  // Add new state
const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
const [logoPreview, setLogoPreview] = useState<string>('');
  // User fills these fields
  const [form, setForm] = useState<FormState>({
    companyName: '',
    website: '',
    title: '',
    description: '',
    category: '',
    skills: [],
    budgetMin: 500,
    budgetMax: 2000,
    duration: '',
    location: 'remote',
    immediate: false,
  });
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompanyLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillAdd = () => {
    if (skill && !form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }));
      setSkill('');
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };
  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true // Only for frontend implementation
  });
  const [prompt, setPrompt] = useState(""); // Add this line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let companyLogoCID = profile.profilePic; // Default to profile pic
    
      if (companyLogoFile) {
        // Upload new logo
        const cid = await uploadFileToIPFS(companyLogoFile);
        const gateway = `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${cid}`;
        
        // Verify image exists
        const img = new Image();
        img.src = gateway;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Company logo not found on IPFS'));
        });
        
        companyLogoCID = gateway;
      }
      // 1. Upload job data to IPFS
      const jobData = {
        ...form,
        poster: account,
      posterProfile: profile.lastCID,
      postedAt: new Date().toISOString(),
      client: {
        id: profile.lastCID,
        name: form.companyName,
        avatar: companyLogoCID
      },
      budget: {
        min: form.budgetMin,
        max: form.budgetMax,
        currency: "USDC"
      }
      };
      
      const cid = await uploadJSONToIPFS(jobData);
      
      // 2. Interact with contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS.toLowerCase(),
        Web3WorkJobsABI,
        signer
      );
  
      const tx = await contract.postJob(cid);
      await tx.wait();
  
      toast.success('Job posted successfully!');
      navigate('/jobs');
    } catch (error) {
      console.error('Job post failed:', error);
      toast.error('Failed to post job');
    }
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a job posting assistant for web3 roles. Generate a job post using this template:
            Title: [Seniority] [Role] for [Project Type]
            Company: ${form.companyName || "Our web3 company"}
            Skills: ${profile.skills?.join(", ") || "Solidity, React"} + [3-5 relevant skills]
            Budget: $${form.budgetMin}-$${form.budgetMax} USDC
            Duration: [1-3 months]
            Responsibilities: 5 bullet points
            Requirements: 5 bullet points`
          },
          {
            role: "user",
            content: prompt || "Create a job post for a smart contract developer"
          }
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.7
      });
  
      const generatedText = response.choices[0]?.message?.content || "";
      
      // Parse the AI response
      const parsedJob = parseGeneratedText(generatedText);
      
      // Update form state
      setForm(prev => ({
        ...prev,
        title: parsedJob.title || prev.title,
        description: parsedJob.description || prev.description,
        skills: parsedJob.skills || prev.skills,
        budgetMin: parsedJob.budgetMin || prev.budgetMin,
        budgetMax: parsedJob.budgetMax || prev.budgetMax,
        duration: parsedJob.duration || prev.duration,
        category: parsedJob.category || prev.category
      }));
      
    } catch (error) {
      console.error("AI generation failed:", error);
      toast.error("Failed to generate job post");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Add this helper function
  const parseGeneratedText = (text: string) => {
    // Simple parsing logic - adjust based on your needs
    return {
      title: text.match(/Title:\s*(.+)/)?.[1] || "",
      description: text.match(/Description:\s*([\s\S]+?)(?=Skills:)/)?.[1] || "",
      skills: text.match(/Skills:\s*(.+)/)?.[1]?.split(/,\s*/) || [],
      budgetMin: parseInt(text.match(/\$(\d+)-/)?.[1] || "500"),
      budgetMax: parseInt(text.match(/-\$(\d+)/)?.[1] || "2000"),
      duration: text.match(/Duration:\s*(.+)/)?.[1] || "",
      category: text.match(/Category:\s*(.+)/)?.[1] || "Smart Contract Development"
    };
  };
  

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto pt-24 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Post a Job</h1>
            <p className="text-gray-600">
              Create a smart contract job posting to find the perfect talent
            </p>
          </header>

          {/* Public profile info */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Your Public Profile</h3>
            <div className="space-y-3">
              <div>
                <Label className="block text-sm font-medium mb-1">Wallet Address</Label>
                <Input 
                  value={profile.wallet || account || ''} 
                  readOnly 
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              {profile.lastCID && (
                <div className="text-sm text-gray-500">
                  <a
                    href={`/public-profile/${profile.lastCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-web3-primary hover:underline"
                  >
                    View your public profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Job Posting Form */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-semibold">Job Details</h2>
  <div className="flex items-center gap-2">
    <Label htmlFor="ai-toggle" className="text-sm cursor-pointer">AI Assist</Label>
    <Switch
      id="ai-toggle"
      checked={isAIAssisted}
      onCheckedChange={setIsAIAssisted}
    />
  </div>
</div>

{isAIAssisted && (
  <div className="mb-6 bg-web3-light/30 rounded-lg p-4">
    <Label htmlFor="ai-prompt" className="block text-sm font-medium mb-2">
      Describe your job to our AI assistant
    </Label>
    <div className="flex gap-2">
      <Textarea
        id="ai-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="I need a smart contract developer familiar with Solidity who can build an NFT marketplace..."
        className="resize-none"
      />
      <Button
        type="button"
        onClick={generateWithAI}
        disabled={isGenerating}
        className="bg-web3-primary hover:bg-web3-secondary text-white"
      >
        {isGenerating ? (
          <>
            <span className="mr-2 animate-spin">⟳</span>
            Generating...
          </>
        ) : 'Generate'}
      </Button>
    </div>
  </div>
)}


            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName" className="block text-sm font-medium mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleInputChange}
                    placeholder="e.g. Decentral Labs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="block text-sm font-medium mb-1">
                    Company Website <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    value={form.website}
                    onChange={handleInputChange}
                    placeholder="https://yourcompany.com"
                    required
                  />
                </div>
                {/* Add this section below Company Website */}
<div className="bg-white rounded-2xl shadow p-6 mb-6">
  <h2 className="text-lg font-semibold mb-4">Company Logo</h2>
  <div className="flex flex-col items-center gap-4">
    <img 
      src={logoPreview || (profile.profilePic || '/default-company.png')}
      alt="Preview" 
      className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
    />
    <label className="cursor-pointer bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition">
      Upload Company Logo
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoChange}
      />
    </label>
  </div>
</div>

                <div>
                  <Label htmlFor="title" className="block text-sm font-medium mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Smart Contract Developer"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="block text-sm font-medium mb-1">
                    Job Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Describe the job requirements, deliverables, and timeline..."
                    className="h-32 resize-none"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="block text-sm font-medium mb-1">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={form.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Smart Contract Development">Smart Contract Development</SelectItem>
                      <SelectItem value="Frontend Development">Frontend Development</SelectItem>
                      <SelectItem value="Backend Development">Backend Development</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Content">Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-1">
                    Required Skills <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      placeholder="e.g. Solidity"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSkillAdd();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={handleSkillAdd}
                      className="bg-web3-primary hover:bg-web3-secondary text-white"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.skills.map((skill) => (
                      <span 
                        key={skill} 
                        className="skill-tag flex items-center gap-1" 
                        onClick={() => handleSkillRemove(skill)}
                      >
                        {skill}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="budget" className="block text-sm font-medium mb-1">
                    Budget Range (USDC)
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        value={form.budgetMin}
                        onChange={(e) => setForm(prev => ({ ...prev, budgetMin: Number(e.target.value) }))}
                        min={0}
                      />
                      <span className="text-xs text-gray-500">Min</span>
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={form.budgetMax}
                        onChange={(e) => setForm(prev => ({ ...prev, budgetMax: Number(e.target.value) }))}
                        min={form.budgetMin}
                      />
                      <span className="text-xs text-gray-500">Max</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration" className="block text-sm font-medium mb-1">
                    Duration
                  </Label>
                  <Select 
                    value={form.duration} 
                    onValueChange={(value) => handleSelectChange('duration', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Less than 1 week">Less than 1 week</SelectItem>
                      <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                      <SelectItem value="2-4 weeks">2-4 weeks</SelectItem>
                      <SelectItem value="1-3 months">1-3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="block text-sm font-medium mb-1">
                    Location
                  </Label>
                  <Select 
                    value={form.location} 
                    onValueChange={(value: 'remote' | 'onsite' | 'hybrid') => handleSelectChange('location', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  <Switch
                    id="immediate"
                    checked={form.immediate}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, immediate: checked }))}
                  />
                  <Label htmlFor="immediate" className="ml-2 text-sm">
                    Immediate start required
                  </Label>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Button 
                  type="submit" 
                  className="w-full bg-web3-primary hover:bg-web3-secondary text-white"
                >
                  Create Job & Generate Smart Contract
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
