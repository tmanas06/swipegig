
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
const queryClient = new QueryClient();

const App = () => (
  <ProfileProvider>
  <QueryClientProvider client={queryClient}>
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

            {/* Add more routes as needed */}
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
  </ProfileProvider>
);

export default App;
