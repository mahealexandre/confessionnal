import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SpinGameProps {
  players: Player[];
  roomId: string;
}

export const SpinGame = ({ players, roomId }: SpinGameProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(100);

  useEffect(() => {
    const channel = supabase
      .channel("game_state")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_state",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          if (payload.new.animation_state === "spinning") {
            setIsSpinning(true);
            startSpinAnimation();
          } else if (payload.new.animation_state === "idle") {
            setIsSpinning(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const startSpinAnimation = async () => {
    let speed = 100;
    let index = 0;
    const minSpeed = 800;
    const speedIncrement = 50;
    const duration = 5000; // 5 seconds total
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      
      if (elapsed < duration) {
        // Gradually increase the interval (slow down the animation)
        speed = Math.min(minSpeed, 100 + (elapsed / duration) * 700);
        setAnimationSpeed(speed);
        
        index = (index + 1) % players.length;
        setSelectedIndex(index);
        
        setTimeout(animate, speed);
      } else {
        // Animation complete
        const finalIndex = Math.floor(Math.random() * players.length);
        setSelectedIndex(finalIndex);
        setIsSpinning(false);
        
        // Update the selected player in the database
        updateSelectedPlayer(players[finalIndex].id);
      }
    };

    animate();
  };

  const updateSelectedPlayer = async (playerId: string) => {
    await supabase
      .from("players")
      .update({ is_selected: true })
      .eq("id", playerId);

    await supabase
      .from("game_state")
      .update({ 
        animation_state: "idle",
        current_player_id: playerId 
      })
      .eq("room_id", roomId);
  };

  const handleSpin = async () => {
    if (isSpinning) return;

    await supabase
      .from("game_state")
      .update({ animation_state: "spinning" })
      .eq("room_id", roomId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              Qui sera choisi ?
            </h1>
            
            {/* Draw box with spinning animation */}
            <div className="relative h-32 border-4 border-violet-400 rounded-xl bg-white/50 backdrop-blur-sm overflow-hidden">
              <div 
                className={cn(
                  "absolute inset-0 flex items-center justify-center text-2xl font-bold transition-all duration-200",
                  isSpinning && "animate-pulse"
                )}
                style={{
                  transition: `transform ${animationSpeed}ms ease-in-out`
                }}
              >
                <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
                  {players[selectedIndex]?.username || "..."}
                </span>
              </div>
            </div>

            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white text-lg px-8 py-4 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSpinning ? "En cours..." : "Tourner !"}
            </Button>
          </div>
        </div>

        {/* Player list */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Joueurs</h2>
          <div className="grid gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-all",
                  player.is_selected
                    ? "bg-gradient-to-r from-violet-100 to-pink-100 shadow-sm"
                    : "bg-white"
                )}
              >
                <span className="font-medium">{player.username}</span>
                {player.is_selected && (
                  <span className="text-sm text-[#F97316]">Sélectionné</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};