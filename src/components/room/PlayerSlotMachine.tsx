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

      // Start the spinning animation
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
    <div className="text-4xl font-bold text-center mt-8">
      <div 
        className={`transition-all duration-${intervalDelay} transform text-white ${
          isSpinning ? 'scale-110' : ''
        }`}
      >
        {displayedName || "..."}
      </div>
    </div>
  );
};