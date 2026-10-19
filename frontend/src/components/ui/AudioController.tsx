// ============================================================================
// COMPONENTS/UI/AUDIOCONTROLLER.TSX
// AUDIO CONTROLLER BUTTON ON TOPBAR (MUTE/UNMUTE + VOLUME SLIDER)
// ============================================================================
'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Volume1 } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

interface AudioControllerProps {
  className?: string;
  showVolumeSlider?: boolean;
}

export default function AudioController({ className = '', showVolumeSlider = false }: AudioControllerProps) {
  const { isPlaying, isMuted, volume, toggleMute, setVolume, playSFX } = useAudio();
  const [showSlider, setShowSlider] = useState(false);

  const handleClick = () => {
    playSFX('click');
    toggleMute();
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Speaker Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowSlider(true)}
        className={`p-1.5 sm:p-2 rounded-xl border-2 transition-all active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 ${
          !isMuted && isPlaying
            ? 'bg-white/20 border-white/50 text-[#FDE047] hover:bg-white/30 shadow-[0_2px_0_#000088]'
            : 'bg-white/10 border-white/30 text-white/70 hover:bg-white/20 shadow-[0_2px_0_#000088]'
        } ${className}`}
        title={isMuted ? 'Bật âm thanh trò chơi' : 'Tắt âm thanh trò chơi'}
        aria-label="Điều khiển âm thanh"
      >
        {!isMuted ? (
          <>
            {volume > 0.5 ? (
              <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            ) : (
              <Volume1 className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            )}
            {/* Animated Sound Wave Indicator */}
            {isPlaying && (
              <span className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-[#FDE047] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-0.5 h-3 bg-[#FDE047] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-0.5 h-1.5 bg-[#FDE047] rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            )}
          </>
        ) : (
          <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-[#FCA5A5]" />
        )}
      </button>

      {/* Volume Slider Popover on Desktop Hover Only (Hidden on mobile) */}
      {showSlider && (
        <div
          onMouseLeave={() => setShowSlider(false)}
          className="hidden sm:flex absolute right-0 top-full mt-1.5 p-2 rounded-xl bg-[#0F172A] border-2 border-[#1E293B] shadow-xl z-50 items-center gap-2 min-w-[130px] backdrop-blur-md"
        >
          <Music className="w-3.5 h-3.5 text-[#38BDF8] flex-shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              if (isMuted && val > 0) toggleMute();
            }}
            className="w-full h-1.5 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#1A1AFF]"
          />
          <span className="text-[10px] font-mono font-bold text-white w-6 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      )}
    </div>
  );
}
