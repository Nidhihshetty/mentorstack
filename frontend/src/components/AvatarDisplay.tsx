"use client";

import Image from 'next/image';

interface AvatarDisplayProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-12 h-12 text-base',
  md: 'w-16 h-16 text-xl',
  lg: 'w-24 h-24 text-3xl',
  xl: 'w-32 h-32 text-4xl'
};

const gradients = [
  'from-blue-400 to-purple-500',
  'from-green-400 to-teal-500',
  'from-pink-400 to-red-500',
  'from-yellow-400 to-orange-500',
  'from-indigo-400 to-blue-500',
  'from-purple-400 to-pink-500'
];

export default function AvatarDisplay({ 
  avatarUrl, 
  name = 'User',
  size = 'md' 
}: AvatarDisplayProps) {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getGradient = (name: string) => {
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 relative flex-shrink-0`}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="object-cover"
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getGradient(name)} text-white font-bold`}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
