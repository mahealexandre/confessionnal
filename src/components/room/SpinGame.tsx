import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface SpinGameProps {
  players: Player[];
  roomId: string;
}

export const SpinGame = ({ players, roomId }: SpinGameProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();

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
        async (payload: any) => {
          if (payload.new.animation_state === "spinning") {
            setIsSpinning(true);
            startSpinAnimation();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const startSpinAnimation = async () => {
    // Simulate spinning animation
    const duration = 5000; // 5 seconds
    const intervals = 20;
    let elapsed = 0;

    const timer = setInterval(async () => {
      const randomIndex = Math.floor(Math.random() * players.length);
      setSelectedPlayer(players[randomIndex]);
      elapsed += intervals;

      if (elapsed >= duration) {
        clearInterval(timer);
        setIsSpinning(false);

        // Select final player randomly
        const finalIndex = Math.floor(Math.random() * players.length);
        const finalPlayer = players[finalIndex];
        setSelectedPlayer(finalPlayer);

        // Update player selection in database
        await supabase
          .from("players")
          .update({ is_selected: true })
          .eq("id", finalPlayer.id);

        toast({
          title: "Joueur sélectionné !",
          description: `${finalPlayer.username} a été choisi !`,
        });
      }
    }, intervals);
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
              Qui sera le prochain ?
            </h1>

            <div className="relative h-32 border-4 border-[#F97316] rounded-xl overflow-hidden bg-white">
              <AnimatePresence>
                {selectedPlayer && (
                  <motion.div
                    key={selectedPlayer.id}
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: -100 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-2xl font-bold text-[#F97316]">
                      {selectedPlayer.username}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white text-xl py-6 px-12"
            >
              {isSpinning ? "En cours..." : "Tourner !"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};