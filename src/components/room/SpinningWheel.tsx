import { useEffect, useRef } from "react";
import { Player } from "@/types/game";

interface SpinningWheelProps {
  players: Player[];
  isSpinning: boolean;
  selectedPlayer: Player | null;
  onSpinComplete: () => void;
}

export const SpinningWheel = ({ players, isSpinning, selectedPlayer, onSpinComplete }: SpinningWheelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSpinning && containerRef.current) {
      const container = containerRef.current;
      const scrollHeight = container.scrollHeight;
      const duration = 3000; // 3 seconds
      let start: number | null = null;

      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = (timestamp - start) / duration;

        if (progress < 1) {
          // Easing function for smooth deceleration
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          // Calculate final position to ensure it stops on the selected player
          const selectedIndex = selectedPlayer ? players.indexOf(selectedPlayer) : 0;
          const itemHeight = scrollHeight / players.length;
          const finalPosition = selectedIndex * itemHeight;
          
          // Calculate current scroll position
          const currentScroll = scrollHeight * easeOut;
          const adjustedScroll = (currentScroll + finalPosition) % scrollHeight;
          
          container.scrollTop = adjustedScroll;
          requestAnimationFrame(animate);
        } else {
          // Ensure we stop exactly on the selected player
          if (selectedPlayer) {
            const selectedIndex = players.indexOf(selectedPlayer);
            const itemHeight = scrollHeight / players.length;
            container.scrollTop = selectedIndex * itemHeight;
          }
          onSpinComplete();
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isSpinning, players, selectedPlayer, onSpinComplete]);

  return (
    <div className="relative w-full max-w-md mx-auto h-16">
      {/* Fixed indicator arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6 text-2xl text-indigo-600 z-10">
        ↓
      </div>
      
      <div className="relative w-full h-16 overflow-hidden bg-white/80 backdrop-blur-sm rounded-lg shadow-lg">
        <div
          ref={containerRef}
          className="h-full overflow-hidden"
          style={{
            scrollBehavior: isSpinning ? 'auto' : 'smooth'
          }}
        >
          {/* Repeat the list multiple times to create infinite scroll effect */}
          {[...Array(3)].map((_, i) => (
            players.map((player) => (
              <div
                key={`${player.id}-${i}`}
                className={`h-16 flex items-center justify-center text-xl font-bold transition-colors
                  ${selectedPlayer?.id === player.id ? 'text-indigo-600' : 'text-gray-700'}`}
              >
                {player.username}
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
};