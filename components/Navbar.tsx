'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import LogoPill from './LogoPill';

export default function Navbar() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch {
      toast.error('Failed to sign out. Please try again.');
    }
  };

  return (
    <nav className="w-full px-4 py-3 flex items-center justify-between border-b border-[rgba(201,162,39,0.2)] bg-[#2C0A0A]">
      <LogoPill />
      <button
        onClick={handleSignOut}
        className="text-sm font-inter font-medium text-[#C4A882] hover:text-[#C9A227] border border-[rgba(201,162,39,0.3)] rounded-lg px-4 py-2 transition-colors"
      >
        Sign Out
      </button>
    </nav>
  );
}
