import React from 'react';

export interface AvatarProps {
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

const COLOR_PALETTES = [
  'bg-violet-500 text-white',
  'bg-teal-500 text-white',
  'bg-emerald-500 text-white',
  'bg-blue-500 text-white',
  'bg-indigo-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-fuchsia-500 text-white',
];

const getHashColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
};

export const Avatar: React.FC<AvatarProps> = ({
  username = 'User',
  size = 'md',
  online,
  className = '',
}) => {
  const initial = (username?.trim()?.[0] || 'U').toUpperCase();
  const colorClass = getHashColor(username || 'User');

  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-16 h-16 text-xl font-bold',
  }[size];

  const onlineDotSizes = {
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3.5 h-3.5 ring-2',
    xl: 'w-4 h-4 ring-2',
  }[size];

  return (
    <div className={`relative inline-flex flex-shrink-0 items-center justify-center ${className}`}>
      <div
        className={`${sizeStyles} ${colorClass} rounded-full flex items-center justify-center select-none shadow-sm transition-transform`}
        title={username}
      >
        {initial}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-white ${
            online ? 'bg-emerald-500' : 'bg-slate-300'
          } ${onlineDotSizes}`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
