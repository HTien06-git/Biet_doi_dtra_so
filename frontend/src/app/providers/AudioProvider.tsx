// ============================================================================
// APP/PROVIDERS/AUDIOPROVIDER.TSX
// GLOBAL AUDIO MANAGER & BACKGROUND MUSIC (BGM) PROVIDER
// Infinite looping, browser autoplay unlock on first touch, persistent volume/mute
// ============================================================================
'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTrack: string;
  playBGM: (trackUrl?: string) => void;
  pauseBGM: () => void;
  resumeBGM: () => void;
  toggleMute: () => void;
  setVolume: (level: number) => void;
  ensureAutoplay: () => void;
  playSFX: (type: 'correct' | 'wrong' | 'click' | 'magnify' | 'select' | 'open') => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

const DEFAULT_BGM = '/audio/bgm-main.mp3';
const STORAGE_MUTED_KEY = 'game_sound_muted';
const STORAGE_VOLUME_KEY = 'game_sound_volume';

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.35);
  const [currentTrack, setCurrentTrack] = useState<string>(DEFAULT_BGM);

  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef<boolean>(false);

  // Initialize audio element & load preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load stored preferences (ưu tiên mặc định BẬT NHẠC cho trải nghiệm game sôi động)
    const storedVolume = localStorage.getItem(STORAGE_VOLUME_KEY);
    const initialVolume = storedVolume ? parseFloat(storedVolume) : 0.35;

    setIsMuted(false);
    setVolumeState(initialVolume);

    // Create persistent HTML5 Audio instance for BGM
    const audio = new Audio(DEFAULT_BGM);
    audio.loop = true;
    audio.volume = initialVolume;
    audio.preload = 'auto';
    bgmAudioRef.current = audio;

    // Attempt autoplay immediately upon landing
    const tryAutoplay = () => {
      audio.play().then(() => {
        setIsPlaying(true);
        hasInteractedRef.current = true;
      }).catch(() => {
        // Trình duyệt chặn tự phát âm thanh -> chờ tương tác đầu tiên của người dùng
        setIsPlaying(false);
      });
    };

    tryAutoplay();

    // Global listener for first user interaction (touch, click, pointer, scroll, key) to immediately unlock and play BGM
    const unlockAutoplay = () => {
      if (hasInteractedRef.current && bgmAudioRef.current && !bgmAudioRef.current.paused) return;
      hasInteractedRef.current = true;

      const currentAudio = bgmAudioRef.current;
      if (currentAudio) {
        currentAudio.muted = false;
        currentAudio.volume = initialVolume;
        currentAudio.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Playback error after user interaction:', err);
        });
      }

      cleanupListeners();
    };

    const cleanupListeners = () => {
      ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown', 'scroll'].forEach((evt) => {
        window.removeEventListener(evt, unlockAutoplay);
        document.removeEventListener(evt, unlockAutoplay);
      });
    };

    ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown', 'scroll'].forEach((evt) => {
      window.addEventListener(evt, unlockAutoplay, { passive: true, once: true });
      document.addEventListener(evt, unlockAutoplay, { passive: true, once: true });
    });

    return () => {
      cleanupListeners();
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    };
  }, []);

  // Update volume & mute on the audio element
  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = isMuted ? 0 : volume;
      bgmAudioRef.current.muted = isMuted;
    }
  }, [isMuted, volume]);

  const ensureAutoplay = useCallback(() => {
    const audio = bgmAudioRef.current;
    if (audio && audio.paused && !isMuted) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  }, [isMuted]);

  const playBGM = useCallback((trackUrl?: string) => {
    const audio = bgmAudioRef.current;
    if (!audio) return;

    const targetTrack = trackUrl || DEFAULT_BGM;
    if (audio.src !== targetTrack && !audio.src.endsWith(targetTrack)) {
      audio.src = targetTrack;
      setCurrentTrack(targetTrack);
    }

    audio.volume = isMuted ? 0 : volume;
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.warn('BGM play blocked or failed:', err);
      setIsPlaying(false);
    });
  }, [isMuted, volume]);

  const pauseBGM = useCallback(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resumeBGM = useCallback(() => {
    if (bgmAudioRef.current && !isMuted) {
      bgmAudioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.warn);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_MUTED_KEY, String(next));
      if (bgmAudioRef.current) {
        bgmAudioRef.current.muted = next;
        bgmAudioRef.current.volume = next ? 0 : volume;
        if (!next && bgmAudioRef.current.paused) {
          bgmAudioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
        }
      }
      return next;
    });
  }, [volume]);

  const setVolume = useCallback((level: number) => {
    const clamped = Math.max(0, Math.min(1, level));
    setVolumeState(clamped);
    localStorage.setItem(STORAGE_VOLUME_KEY, String(clamped));
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = isMuted ? 0 : clamped;
    }
  }, [isMuted]);

  // Procedural Sound Effects (SFX) synthesis for tactile feedback
  const playSFX = useCallback((type: 'correct' | 'wrong' | 'click' | 'magnify' | 'select' | 'open') => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      const sfxVol = Math.max(0.1, volume * 0.7);

      if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(sfxVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(180, now + 0.15);
        gain.gain.setValueAtTime(sfxVol * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'magnify') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(sfxVol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(sfxVol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch {
      // AudioContext not allowed or not supported
    }
  }, [isMuted, volume]);

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        isMuted,
        volume,
        currentTrack,
        playBGM,
        pauseBGM,
        resumeBGM,
        toggleMute,
        setVolume,
        ensureAutoplay,
        playSFX,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return ctx;
}
