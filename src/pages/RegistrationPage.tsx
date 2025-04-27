import React from "react";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";

export default function RegistrationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <Header />
      <div className="container mx-auto pt-24 pb-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center border border-purple-100">
          <div className="flex flex-col items-center mb-6">
            <PersonAddAltIcon
              style={{
                color: "#a78bfa",
                fontSize: 48,
                marginBottom: 10,
                background: "#ede9fe",
                borderRadius: "50%",
                padding: 12,
              }}
            />
            <h1 className="text-3xl font-extrabold text-purple-700 mb-2">
              Ready to Join the Decentralized Talent Revolution?
            </h1>
            <p className="text-lg text-gray-700 mb-4">
              Create your <span className="font-semibold text-purple-600">Web3Work</span> profile to unlock AI-powered job matching, on-chain reputation, and instant, trustless payments.
            </p>
          </div>
          <Button
            variant="contained"
            size="large"
            style={{
              background: "linear-gradient(90deg, #a78bfa 0%, #7c3aed 100%)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.1rem",
              borderRadius: "1.5rem",
              padding: "0.75rem 2.5rem",
              marginBottom: "1.5rem",
              boxShadow: "0 4px 20px 0 #a78bfa33",
            }}
            onClick={() => navigate('/settings')}
            startIcon={<PersonAddAltIcon />}
          >
            Create Your Profile
          </Button>
          <div className="mt-8 text-left border-t border-purple-100 pt-6">
            <h2 className="text-lg font-bold text-purple-700 mb-2">
              Why Register?
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <span className="font-semibold text-purple-600">Showcase your skills</span> and let AI match you to the best opportunities.
              </li>
              <li>
                <span className="font-semibold text-purple-600">Earn on-chain reputation</span> as you complete jobs and grow your network.
              </li>
              <li>
                <span className="font-semibold text-purple-600">Get paid instantly</span> with secure, trustless smart contract payments.
              </li>
              <li>
                <span className="font-semibold text-purple-600">Connect your socials, NFTs, and credentials</span> for a truly web3-native identity.
              </li>
              <li>
                <span className="font-semibold text-purple-600">Join a thriving, global community</span> of builders, creators, and innovators.
              </li>
            </ul>
          </div>
          <div className="mt-10 text-center text-gray-400 text-sm">
            Already have a profile? <span className="text-purple-600 cursor-pointer hover:underline" onClick={() => navigate('/profile')}>View your profile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
