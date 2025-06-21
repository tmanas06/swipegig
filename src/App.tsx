
import * as React from 'react';

type PropsWithChildren = {
  children: React.ReactNode;
};
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/context/WalletContext";
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
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { WalletConnectButton } from "./components/WalletConnectButton";

const queryClient = new QueryClient();

const WalletWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <UnifiedWalletProvider
      wallets={[]}
      config={{
        autoConnect: false,
        env: 'devnet', // Using devnet for testing
        metadata: {
          name: 'Rootstock Hackathon',
          description: 'Rootstock Hackathon Project',
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/settings" element={<Settings />} />
<Route path="/register" element={<RegistrationPage />} />
<Route path="/public-profile/:cid" element={<PublicProfile />} />
            <Route path="/pay" element={<PaymentsPage />} />
            <Route path="/wallet" element={
              <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                  <h1 className="text-2xl font-bold mb-6 text-center">Wallet Connection</h1>
                  <div className="flex justify-center">
                    <WalletConnectButton />
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
