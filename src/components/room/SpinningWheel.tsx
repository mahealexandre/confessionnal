import { useEffect, useRef } from "react";
import { Player } from "@/types/game";

interface SpinningWheelProps {
  players: Player[];
  isSpinning: boolean;
  selectedPlayer: Player | null;
  onSpinComplete: () => void;
}

export const SpinningWheel = ({ players, isSpinning, selectedPlayer, onSpinComplete }: SpinningWheelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const segmentAngle = (2 * Math.PI) / players.length;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wheel segments
    players.forEach((player, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = (index + 1) * segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = index % 2 === 0 ? "#E5DEFF" : "#FFDEE2";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.stroke();

      // Add player names
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#4B5563";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(player.username, radius - 30, 5);
      ctx.restore();
    });

  }, [players, selectedPlayer]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Fixed arrow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4">
        <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[30px] border-l-indigo-600 border-b-[15px] border-b-transparent" />
      </div>
      
      {/* Spinning wheel container */}
      <div 
        ref={wheelRef}
        className={`relative ${
          isSpinning 
            ? "animate-[spin_3s_cubic-bezier(0.4,0,0.2,1)]" 
            : "transition-transform duration-500"
        }`}
        style={{
          transformOrigin: "center center",
          willChange: "transform"
        }}
        onAnimationEnd={onSpinComplete}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};