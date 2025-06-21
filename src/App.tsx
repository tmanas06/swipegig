
import * as React from 'react';
import { Wallet } from 'lucide-react';

type PropsWithChildren = {
  children: React.ReactNode;
};

// Import components
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { WalletProvider } from "@/context/WalletContext";


// Import pages
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import PostJob from "./pages/PostJob";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import MyProfile from "./pages/MyProfile";
import Settings from "./pages/Settings";
import { ProfileProvider } from './contexts/ProfileContext';
import RegistrationPage from "./pages/RegistrationPage";
import PublicProfile from "./pages/publicProfile";
import PaymentsPage from "./pages/PaymentsPage";
import PhantomProfile from "./pages/PhantomProfile";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { WalletConnectButton } from "./components/WalletConnectButton";

// Import UI components
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

const WalletWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <UnifiedWalletProvider
      wallets={[]}
      config={{
        autoConnect: false,
        env: 'devnet', // Using devnet for testing
        metadata: {
          name: 'Swipegig',
          description: 'Hackathon Project',
          url: 'https://your-project-url.com',
          iconUrls: ['https://your-project-url.com/logo.png'],
        },
        walletlistExplanation: {
          href: 'https://docs.jup.ag/wallet-adapter/installation',
        },
      }}
    >
      {children}
    </UnifiedWalletProvider>
  );
};

const App: React.FC = () => (
  <ProfileProvider>
    <QueryClientProvider client={queryClient}>
      <WalletWrapper>
        <WalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/post-job" element={<PostJob />} />
            <Route path="/Hire-talents" element={<PostJob />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/settings" element={<Settings />} />
<Route path="/register" element={<RegistrationPage />} />
<Route path="/public-profile/:cid" element={<PublicProfile />} />
            <Route path="/pay" element={<PaymentsPage />} />
            <Route path="/phantom" element={<PhantomProfile />} />
            <Route path="/wallet" element={
              <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                  <h1 className="text-2xl font-bold mb-6 text-center">Wallet Connection</h1>
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-center">
                      <WalletConnectButton />
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm mb-2">Or</p>
                      <Link 
                        to="/phantom" 
                        className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Connect Phantom Wallet
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            } />

            {/* Add more routes as needed */}
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WalletProvider>
      </WalletWrapper>
    </QueryClientProvider>
  </ProfileProvider>
);

export default App;
