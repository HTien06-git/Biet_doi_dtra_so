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

function GameContainer() {
  const { state } = useGame();
  const [soundEnabled, setSoundEnabled] = useState(() => sounds.isEnabled());
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleToggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
    if (next) sounds.playClick();
  };

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
      {/* Top Floating Sound Control on Welcome Screen only */}
      {state.currentScreen === 'welcome' && (
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className="w-9 h-9 rounded-full bg-white border-2 border-[#1E293B] text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shadow-[0_3px_0_#1E293B] active:translate-y-0.5 transition-all"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#1A1AFF]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#64748B]" />
            )}
          </button>
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
