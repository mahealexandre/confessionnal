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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40; // Reduced radius to make room for arrow

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

    // Draw arrow (outside the wheel)
    ctx.save();
    ctx.translate(centerX + radius + 20, centerY);
    ctx.fillStyle = "#6366F1";
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-30, 0);
    ctx.lineTo(0, 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  }, [players, selectedPlayer]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className={`w-full h-full ${
          isSpinning ? "animate-[spin_3s_ease-out]" : ""
        }`}
        onAnimationEnd={onSpinComplete}
      />
    </div>
  );
};