import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';

// Dummy developer data
const developers = [
  {
    id: 1,
    name: 'Alex Chen',
    title: 'Senior Solidity Developer',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    location: 'San Francisco, CA',
    rate: '$120',
    skills: ['Solidity', 'Ethereum', 'Smart Contracts', 'Rust'],
    experience: '5+ years',
    bio: 'Blockchain developer with extensive experience in DeFi protocols and smart contract security audits.'
  },
  {
    id: 2,
    name: 'Priya Patel',
    title: 'Full-Stack Web3 Developer',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    location: 'Bangalore, India',
    rate: '$80',
    skills: ['React', 'Node.js', 'Ethers.js', 'IPFS', 'Hardhat'],
    experience: '4 years',
    bio: 'Passionate about building decentralized applications with great UX. Contributed to multiple DeFi projects.'
  },
  {
    id: 3,
    name: 'Marcus Johnson',
    title: 'Blockchain Security Expert',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    location: 'Berlin, Germany',
    rate: '$150',
    skills: ['Security Audits', 'Smart Contracts', 'Zero-Knowledge Proofs', 'Rust'],
    experience: '6+ years',
    bio: 'Security researcher and blockchain developer specializing in smart contract security and formal verification.'
  }
];

const Talent = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Web3 Talent</h1>
          <p className="text-gray-600">Connect with skilled blockchain developers and Web3 professionals</p>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by skills, location, or name..."
              className="pl-10 py-6 text-base"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Solidity</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">React</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Rust</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Full-time</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Remote</Badge>
          </div>
        </div>

        {/* Developer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {developers.map((dev) => (
            <Card key={dev.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={dev.avatar} alt={dev.name} />
                  <AvatarFallback>{dev.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{dev.name}</CardTitle>
                  <p className="text-sm text-gray-600">{dev.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{dev.location}</p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">{dev.bio}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {dev.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{dev.experience} experience</span>
                  <span className="font-medium">{dev.rate}/hr</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">View Profile</Button>
                <Button size="sm">Hire Me</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Talent;
