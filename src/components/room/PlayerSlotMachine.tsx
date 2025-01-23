import { useEffect, useState } from "react";
import { Player } from "@/types/game";

interface PlayerSlotMachineProps {
  players: Player[];
  isSpinning: boolean;
  finalPlayer: Player | null;
  onSpinComplete: () => void;
}

export const PlayerSlotMachine = ({
  players,
  isSpinning,
  finalPlayer,
  onSpinComplete,
}: PlayerSlotMachineProps) => {
  const [displayedName, setDisplayedName] = useState<string>("");
  
  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        setDisplayedName(randomPlayer.username);
      }, 100); // Change names rapidly

      // Stop after 1.5 seconds
      setTimeout(() => {
        clearInterval(interval);
        if (finalPlayer) {
          setDisplayedName(finalPlayer.username);
          onSpinComplete();
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isSpinning, players, finalPlayer, onSpinComplete]);

  return (
    <div className="text-2xl font-bold text-center mt-8 p-4 bg-white/50 rounded-lg shadow">
      <div className={`transition-all duration-100 ${isSpinning ? 'animate-bounce' : ''}`}>
        {displayedName || "..."}
      </div>
    </div>
  );
};