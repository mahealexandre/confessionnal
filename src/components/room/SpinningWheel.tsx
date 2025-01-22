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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw wheel segments
    players.forEach((player, index) => {
      const startAngle = (index * 2 * Math.PI) / players.length;
      const endAngle = ((index + 1) * 2 * Math.PI) / players.length;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternate colors for better visibility
      ctx.fillStyle = index % 2 === 0 ? "#E5DEFF" : "#FFDEE2";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.stroke();

      // Add player names
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + (endAngle - startAngle) / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#4B5563";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(player.username, radius - 30, 5);
      ctx.restore();
    });

  }, [players, selectedPlayer]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Stationary arrow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 transform -translate-x-4">
        <div className="w-8 h-8">
          <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[30px] border-l-indigo-500 border-b-[15px] border-b-transparent" />
        </div>
      </div>
      
      {/* Spinning wheel container */}
      <div 
        ref={wheelRef}
        className={`relative w-full aspect-square ${
          isSpinning ? "animate-[spin_3s_ease-out]" : ""
        }`}
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