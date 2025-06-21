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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TokenSelector } from '@/components/TokenSelector';

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
  paymentToken: string;
}

const PostJob = () => {
  const [prompt, setPrompt] = useState<string>("");
  const navigate = useNavigate();
  const { account } = useWallet();
  const { profile } = useProfile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAIAssisted] = useState(true);
  const [skill, setSkill] = useState<string>('');
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");
  // isSubmitting is used in the form submission logic to prevent multiple submissions

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
    paymentToken: 'USDC', // Default token
  });

  // Wallet connection is handled at the route level

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
    apiKey: import.meta.env['VITE_GROQ_API_KEY'],
    dangerouslyAllowBrowser: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    let companyLogoCID = profile?.profilePic || '';
    
    try {
      // Validate form
      // Update the validation in handleSubmit
      if (!form.title) {
        throw new Error('Job title is required');
      }
      if (!form.description) {
        throw new Error('Job description is required');
      }
      if (!form.category) {
        throw new Error('Please select a category');
      }
      if (form.skills.length === 0) {
        throw new Error('Please add at least one required skill');
      }

      if (form.budgetMin > form.budgetMax) {
        throw new Error('Minimum budget cannot be greater than maximum budget');
      }

      // Handle company logo upload if provided
      if (companyLogoFile) {
        try {
          const cid = await uploadFileToIPFS(companyLogoFile);
          const gateway = `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${cid}`;
          
          // Verify image exists
          const img = new Image();
          img.src = gateway;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error('Failed to upload company logo. Please try again.'));
          });
          
          companyLogoCID = gateway;
        } catch (error) {
          console.error('Logo upload failed:', error);
          throw new Error('Failed to upload company logo. Please try again.');
        }
      }

      const jobData = {
        ...form,
        poster: account,
        posterProfile: profile?.lastCID || '',
        postedAt: new Date().toISOString(),
        client: {
          id: profile?.lastCID || '',
          name: form.companyName || 'Anonymous',
          avatar: companyLogoCID
        },
        budget: {
          min: form.budgetMin,
          max: form.budgetMax,
          currency: form.paymentToken || 'USDC',
          tokenAddress: '' // Add token address if needed
        },
        status: 'open',
        applicants: [],
        createdAt: Math.floor(Date.now() / 1000)
      };
      
      // Upload job data to IPFS
      const cid = await uploadJSONToIPFS(jobData);
      
      // Get signer from wallet context
      if (!window.ethereum) {
        throw new Error('Ethereum provider not found');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS?.toLowerCase(),
        Web3WorkJobsABI,
        signer
      );
  
      const tx = await contract.postJob(cid);
      const receipt = await tx.wait();
  
      if (receipt.status === 1) {
        toast.success('Job posted successfully!');
        navigate('/jobs');
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Job post failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWithAI = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `
              You are an AI assistant for a Web3 gig posting platform. 
              Generate a complete job listing based on the user's description.
              Include: title, description, required skills, and estimated duration.
              Format the response with clear sections for each field.
              Respond in markdown format with sections for Title, Description, Skills, and Duration.
            `
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7
      });

      const generatedText = response.choices[0]?.message?.content || "";
      setAiResponse(generatedText);
      
      // Parse the AI response
      const parsedJob = {
        title: generatedText.match(/^#?\s*Title:?\s*([^\n]+)/im)?.[1]?.trim() || '',
        description: generatedText.match(/##?\s*Description:?\s*([\s\S]+?)(?=##?\s*(Skills|Duration|$))/im)?.[1]?.trim() || '',
        skills: generatedText.match(/##?\s*Skills?:?\s*([^#]+)/im)?.[1]?.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || [],
        budgetMin: parseInt(generatedText.match(/Min\s*[bB]udget:\s*\$?(\d+)/i)?.[1] || "500"),
        budgetMax: parseInt(generatedText.match(/Max\s*[bB]udget:\s*\$?(\d+)/i)?.[1] || "2000"),
        duration: generatedText.match(/##?\s*Duration:?\s*([^#\n]+)/im)?.[1]?.trim() || '',
        category: generatedText.match(/##?\s*[Cc]ategory:?\s*([^#\n]+)/im)?.[1]?.trim() || "Smart Contract Development"
      };

      setForm(prev => ({
        ...prev,
        title: parsedJob.title || prev.title,
        description: parsedJob.description || prev.description,
        skills: parsedJob.skills.length ? parsedJob.skills : prev.skills,
        budgetMin: !isNaN(parsedJob.budgetMin) ? parsedJob.budgetMin : prev.budgetMin,
        budgetMax: !isNaN(parsedJob.budgetMax) ? parsedJob.budgetMax : prev.budgetMax,
        duration: parsedJob.duration || prev.duration,
        category: parsedJob.category || prev.category
      }));

    } catch (error) {
      console.error("AI generation failed:", error);
      toast.error("Failed to generate job post. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Post a New Job</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            {isAIAssisted && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-2">AI Job Description Assistant</h3>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the job you want to post..."
                  className="mb-2 min-h-[100px]"
                  disabled={isGenerating}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={generateWithAI}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-1"
                  >
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPrompt('');
                      setAiResponse('');
                    }}
                    disabled={isGenerating}
                  >
                    Clear
                  </Button>
                </div>
                {aiResponse && (
                  <div className="mt-4 p-3 bg-white border rounded-md">
                    <h4 className="text-sm font-medium mb-2">AI Suggestion:</h4>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {aiResponse}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      name="companyName"
                      value={form.companyName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label>Job Title</Label>
                    <Input
                      name="title"
                      value={form.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label>Job Description</Label>
                    <Textarea
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      rows={6}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
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
                        <SelectItem value="Full Stack">Full Stack</SelectItem>
                        <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Required Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSkillAdd();
                          }
                        }}
                        placeholder="Add a skill"
                      />
                      <Button type="button" onClick={handleSkillAdd}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.skills.map((s) => (
                        <span key={s} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                          {s}
                          <button
                            type="button"
                            onClick={() => handleSkillRemove(s)}
                            className="ml-1 text-gray-500 hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Budget (USDC)</Label>
                      <Input
                        type="number"
                        value={form.budgetMin}
                        onChange={(e) => setForm(prev => ({ ...prev, budgetMin: Number(e.target.value) }))}
                        min="0"
                        step="100"
                      />
                    </div>
                    <div>
                      <Label>Max Budget (USDC)</Label>
                      <Input
                        type="number"
                        value={form.budgetMax}
                        onChange={(e) => setForm(prev => ({ ...prev, budgetMax: Number(e.target.value) }))}
                        min={form.budgetMin}
                        step="100"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Duration</Label>
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
                        <SelectItem value="6+ months">6+ months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Location</Label>
                    <Select
                      value={form.location}
                      onValueChange={(value) => handleSelectChange('location', value as 'remote' | 'onsite' | 'hybrid')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="immediate"
                      checked={form.immediate}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, immediate: checked }))}
                    />
                    <Label htmlFor="immediate">Immediate start required</Label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </>
                  ) : 'Post Job'}
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