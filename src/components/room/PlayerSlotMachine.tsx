import { useEffect, useState, useCallback } from "react";
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
  const [intervalDelay, setIntervalDelay] = useState<number>(50);
  
  const getRandomPlayer = useCallback(() => {
    return players[Math.floor(Math.random() * players.length)].username;
  }, [players]);

  useEffect(() => {
    if (isSpinning) {
      let currentDelay = 50; // Start fast
      const maxDelay = 300; // End slow
      const incrementDelay = 10; // How much to slow down each iteration
      let timeoutId: NodeJS.Timeout;

      const spin = () => {
        setDisplayedName(getRandomPlayer());
        currentDelay = Math.min(currentDelay + incrementDelay, maxDelay);
        setIntervalDelay(currentDelay);

        if (currentDelay < maxDelay) {
          timeoutId = setTimeout(spin, currentDelay);
        } else {
          // Animation complete, trigger final reveal after a brief pause
          setTimeout(() => {
            if (finalPlayer) {
              setDisplayedName(finalPlayer.username);
              onSpinComplete();
            }
          }, 200);
        }
      };

      timeoutId = setTimeout(spin, currentDelay);

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    } else if (!isSpinning && !finalPlayer) {
      setDisplayedName("");
      setIntervalDelay(50);
    }
  }, [isSpinning, finalPlayer, getRandomPlayer, onSpinComplete]);

  return (
    <div className="relative w-full max-w-xl mx-auto px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-r from-[#9b87f5]/20 to-[#FEC6A1]/20 rounded-xl blur-xl" />
      <div className="relative">
        <div 
          className={`text-5xl md:text-6xl font-bold text-center transition-all duration-${intervalDelay} transform
            ${isSpinning ? 'scale-110 text-[#8B5CF6]' : 'text-[#7E69AB]'}
            ${!displayedName ? 'opacity-50' : 'opacity-100'}
          `}
        >
          {displayedName || "..."}
        </div>
        {isSpinning && (
          <div className="absolute -inset-1 bg-gradient-to-r from-[#9b87f5] to-[#FEC6A1] rounded-lg opacity-30 animate-pulse" />
        )}
      </div>
    </div>
  );
};