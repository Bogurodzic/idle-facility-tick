import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export const GameTicker = () => {
  const { tick, calculateOfflineProgress, gameStarted } = useGameStore();

  useEffect(() => {
    if (!gameStarted) return;

    // Calculate offline progress on game start
    calculateOfflineProgress();

    // Set up game tick interval
    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [tick, calculateOfflineProgress, gameStarted]);

  // This component doesn't render anything
  return null;
};