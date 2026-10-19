// ============================================================================
// GAME ICON - Hệ thống Huy hiệu Game Vector 2D (3D Glossy Cartoon Badge)
// Thay thế toàn bộ emoji mặc định bằng icon vector sắc nét, viền đậm, bóng phản quang
// ============================================================================
'use client';

import React from 'react';
import {
  PhoneCall,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  Trophy,
  Search,
  FolderArchive,
  Puzzle,
  ShieldCheck,
  Star,
  Lock,
  CheckCircle,
  FileText,
  CreditCard,
  Camera,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export type GameIconType =
  | 'phone'
  | 'alert'
  | 'shopping'
  | 'trending'
  | 'trophy'
  | 'search'
  | 'folder'
  | 'puzzle'
  | 'shield'
  | 'star'
  | 'lock'
  | 'check'
  | 'file'
  | 'card'
  | 'camera'
  | 'message'
  | 'sparkles';

export type GameIconTheme = 'amber' | 'emerald' | 'ruby' | 'sapphire' | 'amethyst' | 'wood';

interface GameIconProps {
  type: GameIconType;
  theme?: GameIconTheme;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const themeStyles: Record<GameIconTheme, { bg: string; border: string; iconColor: string; shadow: string }> = {
  amber: {
    bg: 'linear-gradient(180deg, #FDE047 0%, #F59E0B 100%)',
    border: '#451A03',
    iconColor: '#78350F',
    shadow: '#B45309',
  },
  emerald: {
    bg: 'linear-gradient(180deg, #6EE7B7 0%, #10B981 100%)',
    border: '#064E3B',
    iconColor: '#064E3B',
    shadow: '#047857',
  },
  ruby: {
    bg: 'linear-gradient(180deg, #FCA5A5 0%, #EF4444 100%)',
    border: '#7F1D1D',
    iconColor: '#7F1D1D',
    shadow: '#B91C1C',
  },
  sapphire: {
    bg: 'linear-gradient(180deg, #93C5FD 0%, #3B82F6 100%)',
    border: '#1E3A8A',
    iconColor: '#1E3A8A',
    shadow: '#1D4ED8',
  },
  amethyst: {
    bg: 'linear-gradient(180deg, #D8B4FE 0%, #A855F7 100%)',
    border: '#581C87',
    iconColor: '#581C87',
    shadow: '#7E22CE',
  },
  wood: {
    bg: 'linear-gradient(180deg, #D97706 0%, #8B4513 100%)',
    border: '#331A05',
    iconColor: '#FFFFFF',
    shadow: '#451A03',
  },
};

const sizeStyles = {
  sm: { box: 'w-7 h-7 rounded-lg border-2', icon: 14 },
  md: { box: 'w-10 h-10 rounded-xl border-[2.5px]', icon: 20 },
  lg: { box: 'w-14 h-14 rounded-2xl border-3', icon: 28 },
  xl: { box: 'w-18 h-18 rounded-3xl border-4', icon: 36 },
};

export default function GameIcon({
  type,
  theme = 'amber',
  size = 'md',
  className = '',
}: GameIconProps) {
  const currentTheme = themeStyles[theme];
  const currentSize = sizeStyles[size];

  const renderIcon = (iconSize: number) => {
    const props = { size: iconSize, strokeWidth: 2.5, className: 'drop-shadow-sm' };
    switch (type) {
      case 'phone': return <PhoneCall {...props} />;
      case 'alert': return <AlertTriangle {...props} />;
      case 'shopping': return <ShoppingBag {...props} />;
      case 'trending': return <TrendingUp {...props} />;
      case 'trophy': return <Trophy {...props} />;
      case 'search': return <Search {...props} />;
      case 'folder': return <FolderArchive {...props} />;
      case 'puzzle': return <Puzzle {...props} />;
      case 'shield': return <ShieldCheck {...props} />;
      case 'star': return <Star {...props} />;
      case 'lock': return <Lock {...props} />;
      case 'check': return <CheckCircle {...props} />;
      case 'file': return <FileText {...props} />;
      case 'card': return <CreditCard {...props} />;
      case 'camera': return <Camera {...props} />;
      case 'message': return <MessageSquare {...props} />;
      case 'sparkles': return <Sparkles {...props} />;
      default: return <Search {...props} />;
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none overflow-hidden ${currentSize.box} ${className}`}
      style={{
        background: currentTheme.bg,
        borderColor: currentTheme.border,
        boxShadow: `0 3px 0 ${currentTheme.shadow}`,
        color: currentTheme.iconColor,
      }}
    >
      {/* 3D Glossy Reflection Highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-[inherit]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 100%)',
        }}
      />
      {/* Icon Content */}
      <span className="relative z-10 flex items-center justify-center">
        {renderIcon(currentSize.icon)}
      </span>
    </div>
  );
}
