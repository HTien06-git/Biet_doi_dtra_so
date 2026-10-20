// ============================================================================
// MAIN PAGE - ĐỘI ĐIỀU TRA SỐ: VƯỢT TRẠM PHÁ ÁN
// Điều phối toàn bộ màn hình trò chơi theo phong cách Case Hunter
// ============================================================================
'use client';

import { useState, useEffect } from 'react';
import { GameProvider, useGame } from '@/lib/gameStore';
import WelcomeScreen from '@/components/WelcomeScreen';
import LobbyScreen from '@/components/LobbyScreen';
import StationsScreen from '@/components/StationsScreen';
import PlayingScreen from '@/components/PlayingScreen';
import SummaryScreen from '@/components/SummaryScreen';
import LeaderboardModal from '@/components/LeaderboardModal';
import { Volume2, VolumeX, Trophy } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { useAudio } from '@/hooks/useAudio';
import AudioController from '@/components/ui/AudioController';

function GameContainer() {
  const { state } = useGame();
  const { ensureAutoplay } = useAudio();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    ensureAutoplay();
  }, [ensureAutoplay]);

  const renderScreen = () => {
    switch (state.currentScreen) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'lobby':
        return <LobbyScreen />;
      case 'stations':
        return <StationsScreen />;
      case 'playing':
        return <PlayingScreen />;
      case 'summary':
        return <SummaryScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <main className="relative min-h-screen bg-game-backdrop text-[#1E293B] selection:bg-[#FFCA28] selection:text-[#3E2723]">
      {/* Top Floating Sound Control on Welcome Screen */}
      {state.currentScreen === 'welcome' && (
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
          <AudioController />
        </div>
      )}

      {/* Active Game Screen */}
      {renderScreen()}

      {/* Global Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        highlightPlayer={{ name: state.playerName, teamCode: state.teamCode }}
      />
    </main>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}
