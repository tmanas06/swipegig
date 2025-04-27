import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SwipeCard } from '@/components/SwipeCard';
import { AnimatePresence } from 'framer-motion';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Web3WorkJobsABI from '../contracts/JobsAbi.json';
import { convertIPFSURL } from '@/utils/ipfs';
import { set } from 'date-fns';

const CONTRACT_ADDRESS = import.meta.env.VITE_JOBS_CONTRACT_ADDRESS;

export interface JobPost {
  id: string; // CID
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: { min: number; max: number; currency: string };
  duration: string;
  location: "remote" | "onsite" | "hybrid"; // Update this to match the stricter type
  immediate: boolean;
  companyName: string;
  website: string;
  poster: string;
  posterProfile: string;
  postedAt: string;
  client: {
    id: string;
    name: string;
    avatar: string;
  };
}

const Jobs = () => {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [matchDialogOpen, setMatchDialogOpen] = useState<boolean>(false);
  const [negotiateDialogOpen, setNegotiateDialogOpen] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<JobPost | null>(null);
  const [swipedJobs, setSwipedJobs] = useState<{[key: string]: 'left' | 'right'}>({});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  console.log('Render state:', {
    jobsCount: jobs.length,
    currentIndex,
    loading,
    shouldShowJobs: jobs.length > 0 && currentIndex < jobs.length
  });
  const loadJobs = async () => {
    console.log('Starting job load...');
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS.toLowerCase(),
        Web3WorkJobsABI,
        provider
      );
      
      // Get active job CIDs
      const cids: string[] = await contract.getActiveJobs();
      console.log('Fetched CIDs:', cids);

      // Fetch job data from IPFS
      const jobsData = await Promise.all(
        cids.map(async (cid: string) => {
          try {
            const response = await fetch(convertIPFSURL(cid));
            const url = convertIPFSURL(cid);
            console.log('Fetching job from:', url);
            if (!response.ok) throw new Error('Failed to fetch job');
            const data = await response.json();
            return { 
              ...data, 
              id: cid,
              budget: data.budget || { min: 0, max: 0, currency: "USDC" },
              client: {
                id: data.client?.id || data.posterProfile || "",
                name: data.client?.name || data.companyName || "Unknown Client",
                avatar: data.client?.avatar || "https://api.dicebear.com/7.x/identicon/svg?seed=" + (data.posterProfile || "web3work")
              },
              location: (['remote', 'onsite', 'hybrid'] as const).includes(data.location) ? data.location as 'remote' | 'onsite' | 'hybrid' : 'remote'
            };
          } catch (error) {
            console.error(`Failed to load job ${cid}:`, error);
            return null;
          }
        })
      );
      
      const validJobs = jobsData.filter(Boolean) as JobPost[];
      console.log('Valid jobs loaded:', validJobs.length);
      setJobs(validJobs);
      setCurrentIndex(0); // Reset swipe position on refresh
      setLoading(false);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
      setLoading(false);
    }
  };
  useEffect(() => {
    loadJobs();
  }, []);

  const handleSwipe = (direction: 'left' | 'right', jobId: string) => {
    console.log('Swiped', direction, 'on job', jobId);
    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      console.log('New currentIndex:', newIndex);
      return newIndex;
    });
  };

  const handleNegotiate = () => {
    setCurrentJob(jobs[currentIndex]);
    setNegotiateDialogOpen(true);
  };

  const handleSendProposal = () => {
    setMatchDialogOpen(false);
    toast.success('Proposal sent! Redirecting to chat...');
    setTimeout(() => {
      navigate('/messages');
    }, 1500);
  };

  const handleNegotiateSubmit = () => {
    setNegotiateDialogOpen(false);
    toast.success('Negotiation proposal sent to the client!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto pt-24 pb-8 px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Work</h1>
          <p className="text-gray-600">
            Swipe right to accept jobs, left to skip, or tap negotiate to customize terms.
          </p>
        </header>
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Swipable cards container */}
          <div className="swipe-container">
   {loading ? (
    <div className="flex flex-col items-center justify-center p-6 text-center min-h-[300px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-4"></div>
      <span className="text-gray-500">Loading jobs...</span>
    </div>
   ) :  jobs.length === 0 ? (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <h3 className="text-xl font-semibold mb-2">No jobs available</h3>
      <Button 
        onClick={loadJobs}
        className="bg-web3-primary hover:bg-web3-secondary text-white"
      >
        Refresh Jobs
      </Button>
    </div>
  ) : currentIndex < jobs.length ? (
    <AnimatePresence>
      <SwipeCard
        key={jobs[currentIndex].id}
        job={jobs[currentIndex]}
        onSwipe={handleSwipe}
        onNegotiate={handleNegotiate}
      />
    </AnimatePresence>
   ) : (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">You've seen all jobs!</h3>
                <Button 
                  onClick={() => {
                    setCurrentIndex(0);
                    loadJobs();
                  }}
                  className="bg-web3-primary hover:bg-web3-secondary text-white"
                >
                  Show Again
                </Button>
    </div>
  )}
</div>

          {/* Swipe controls */}
          <div className="p-4 flex justify-center gap-8">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full w-14 h-14 border-gray-300"
              onClick={() => jobs[currentIndex] && handleSwipe('left', jobs[currentIndex].id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full w-14 h-14 border-blue-300"
              onClick={handleNegotiate}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full w-14 h-14 border-green-300"
              onClick={() => jobs[currentIndex] && handleSwipe('right', jobs[currentIndex].id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">It's a Match! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              You and {currentJob?.client?.name || "the client"} are interested in working together.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-web3-primary">
                <img
                  src={currentJob?.client?.avatar || "https://api.dicebear.com/7.x/identicon/svg?seed=Web3Work"}
                  alt="Client"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg">{currentJob?.title}</h3>
              <p className="text-sm text-gray-600">
                {currentJob?.budget?.min}-{currentJob?.budget?.max} {currentJob?.budget?.currency}
              </p>
            </div>
            <Button onClick={handleSendProposal} className="bg-web3-primary hover:bg-web3-secondary text-white">
              Send Proposal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Negotiate Dialog */}
      <Dialog open={negotiateDialogOpen} onOpenChange={setNegotiateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Negotiate Terms</DialogTitle>
            <DialogDescription>
              Our AI will help you create a custom proposal for this job.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-medium mb-2">AI Suggestion</h3>
              <p className="text-sm text-gray-600">
                Based on your skills and the job requirements, we recommend:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-800">
                <li>
                  • Increase the rate to {currentJob?.budget?.max ? currentJob.budget.max + 500 : '...'} {currentJob?.budget?.currency}
                </li>
                <li>• Extend timeline by 1 week for additional QA</li>
                <li>• Add a maintenance package option</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Your Proposal</h4>
              <textarea
                className="w-full h-24 p-2 border rounded-md focus:ring-2 ring-web3-primary outline-none"
                placeholder="Write your custom proposal terms here..."
                defaultValue={`Hi ${currentJob?.client?.name || "Client"},\n\nI'm interested in your project but would like to suggest a few adjustments to the terms...`}
              />
            </div>
            <Button onClick={handleNegotiateSubmit} className="bg-web3-primary hover:bg-web3-secondary text-white">
              Send Negotiation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
