
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/context/WalletContext';

const Index = () => {
  const { account, connectWallet, userRole, setUserRole } = useWallet();
  const navigate = useNavigate();
  const [isSelecting, setIsSelecting] = useState(false);

  const handleRoleSelect = (role: 'freelancer' | 'client') => {
    setUserRole(role);
    
    if (role === 'freelancer') {
      navigate('/jobs');
    } else {
      navigate('/post-job');
    }
  };

  const handleGetStarted = () => {
    if (!account) {
      connectWallet();
    } else if (!userRole) {
      setIsSelecting(true);
    } else {
      if (userRole === 'freelancer') {
        navigate('/jobs');
      } else {
        navigate('/post-job');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="pt-24 lg:pt-32 pb-16 px-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-web3-light/20 to-web3-primary/10 -z-10"></div>
          
          <div className="w-full max-w-4xl mx-auto mb-8 relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-black bg-clip-text text-transparent">
            Swipe
          </h2>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-web3-primary to-web3-tertiary bg-clip-text text-transparent">
              Find work. Find talent.
              <br /> 
              <span className="text-black dark:text-white">Decentralized.</span>
              <span className="text-web3-primary"> Instant.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              The Web3 talent marketplace with AI matching, on-chain reputation, and trustless payments. Connect your wallet and start working in the decentralized economy.
            </p>
            
            {isSelecting && account && !userRole ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={() => handleRoleSelect('freelancer')}
                  className="bg-web3-primary hover:bg-web3-secondary text-white min-w-[180px]"
                  size="lg"
                >
                  Find Work
                </Button>
                <Button
                  onClick={() => handleRoleSelect('client')}
                  className="bg-web3-primary hover:bg-web3-secondary text-white min-w-[180px]"
                  size="lg"
                >
                  Hire Talent
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleGetStarted}
                className="bg-web3-primary hover:bg-web3-secondary text-white"
                size="lg"
              >
                {account ? 'Get Started' : 'Connect Wallet'}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 mb-4 bg-web3-light flex items-center justify-center rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-web3-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Decentralized Identity</h3>
              <p className="text-gray-600 dark:text-gray-300">Connect your wallet and establish trust with verifiable on-chain credentials.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 mb-4 bg-web3-light flex items-center justify-center rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-web3-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">AI Job Matching</h3>
              <p className="text-gray-600 dark:text-gray-300">Our AI finds the perfect match between talent and opportunities in seconds.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 mb-4 bg-web3-light flex items-center justify-center rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-web3-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Contract Payments</h3>
              <p className="text-gray-600 dark:text-gray-300">Secure escrow and milestone payments without middlemen taking fees.</p>
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-web3-primary">For Freelancers</h3>
                  <ol className="space-y-6">
                    <li className="flex">
                      <span className="bg-web3-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">1</span>
                      <div>
                        <h4 className="font-semibold mb-1">Connect your wallet</h4>
                        <p className="text-gray-600 dark:text-gray-400">Link your crypto wallet to establish your decentralized identity.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <span className="bg-web3-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">2</span>
                      <div>
                        <h4 className="font-semibold mb-1">Create your profile</h4>
                        <p className="text-gray-600 dark:text-gray-400">Showcase your skills and experience with on-chain verification.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <span className="bg-web3-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">3</span>
                      <div>
                        <h4 className="font-semibold mb-1">Swipe through jobs</h4>
                        <p className="text-gray-600 dark:text-gray-400">Our AI matches you with relevant opportunities you can accept instantly.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <span className="bg-web3-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">4</span>
                      <div>
                        <h4 className="font-semibold mb-1">Get paid securely</h4>
                        <p className="text-gray-600 dark:text-gray-400">Receive cryptocurrency payments directly to your wallet via smart contracts.</p>
                      </div>
                    </li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-web3-primary">For Clients</h3>
                  <ol className="space-y-6">
                    <li className="flex">
                      <span className="bg-web3-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">1</span>
                      <div>
                        <h4 className="font-semibold mb-1">Connect your wallet</h4>
                        <p className="text-gray-600 dark:text-gray-400">Establish your organization's on-chain presence.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <span className="bg-web3-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">2</span>
                      <div>
                        <h4 className="font-semibold mb-1">Post a job</h4>
                        <p className="text-gray-600 dark:text-gray-400">Use our AI to help define your needs and create a smart contract.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <span className="bg-web3-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">3</span>
                      <div>
                        <h4 className="font-semibold mb-1">Review matches</h4>
                        <p className="text-gray-600 dark:text-gray-400">Our platform instantly matches you with qualified talent.</p>
                      </div>
                    </li>
                    <li className="flex">
                      <span className="bg-web3-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">4</span>
                      <div>
                        <h4 className="font-semibold mb-1">Release payment</h4>
                        <p className="text-gray-600 dark:text-gray-400">Approve milestones and release funds through secure smart contracts.</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-16 bg-web3-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to join the decentralized work revolution?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">Connect your wallet and start finding opportunities or talent in the Web3 ecosystem.</p>
            <Button
              onClick={handleGetStarted}
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-web3-primary"
            >
              {account ? 'Get Started' : 'Connect Wallet'}
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-xl font-bold">Web3Work</span>
              <p className="text-sm text-gray-400">The decentralized talent marketplace</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
