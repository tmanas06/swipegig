import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { convertIPFSURL } from '@/utils/ipfs';

interface ProfileData {
  name: string;
  bio: string;
  profilePic: string;
  skills: string[];
  portfolio: Array<{ name: string; link: string; rating: number }>;
  social: {
    github: string;
    linkedin: string;
    twitter: string;
  };
  reputation: {
    score: number;
    jobs: number;
    breakdown: Array<{ label: string; value: number }>;
  };
  verified?: boolean;
}

export default function PublicProfile() {
  const { cid } = useParams<{ cid: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(convertIPFSURL(cid || ''));
        if (!response.ok) throw new Error('Profile not found');
        
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (cid) fetchProfile();
  }, [cid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-red-500 text-lg">{error || 'Profile not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto pt-24 pb-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
            <img
              src={profile.profilePic}
              alt={profile.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
              {profile.verified && (
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full mb-2 inline-block">
                  Verified Profile
                </span>
              )}
              <p className="text-gray-600">{profile.bio}</p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Skills & Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Portfolio Work</h2>
            <div className="grid gap-4">
              {profile.portfolio.map((project) => (
                <div
                  key={project.name}
                  className="border rounded-xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium mb-1">{project.name}</h3>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline text-sm"
                  >
                    View Project
                  </a>
                  <div className="mt-2 flex items-center">
                    <span className="text-sm text-gray-500">
                      Rating: {project.rating}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reputation Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Reputation</h2>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{profile.reputation.score}</div>
                <div className="text-sm text-gray-500">Overall Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{profile.reputation.jobs}</div>
                <div className="text-sm text-gray-500">Jobs Completed</div>
              </div>
            </div>
            <div className="space-y-2">
              {profile.reputation.breakdown.map((metric) => (
                <div key={metric.label} className="flex items-center justify-between">
                  <span className="text-gray-600">{metric.label}</span>
                  <span className="font-medium">{metric.value}/5</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Connect</h2>
            <div className="flex gap-4">
              {profile.social.github && (
                <a
                  href={profile.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  GitHub
                </a>
              )}
              {profile.social.linkedin && (
                <a
                  href={profile.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  LinkedIn
                </a>
              )}
              {profile.social.twitter && (
                <a
                  href={profile.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Twitter
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
