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

interface PlayerAction {
  id: string;
  action_text: string;
  used: boolean;
}

export const SpinGame = ({ players, roomId }: SpinGameProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentAction, setCurrentAction] = useState<PlayerAction | null>(null);
  const [availableActions, setAvailableActions] = useState<PlayerAction[]>([]);
  const { toast } = useToast();

  // Fetch and shuffle actions at game start
  useEffect(() => {
    const initializeActions = async () => {
      const { data: actions, error } = await supabase
        .from("player_actions")
        .select("*")
        .eq("room_id", roomId)
        .eq("used", false);

      if (error) {
        console.error("Error fetching actions:", error);
        return;
      }

      if (actions) {
        // Fisher-Yates shuffle algorithm
        const shuffledActions = [...actions];
        for (let i = shuffledActions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledActions[i], shuffledActions[j]] = [shuffledActions[j], shuffledActions[i]];
        }
        setAvailableActions(shuffledActions);
      }
    };

    initializeActions();
  }, [roomId]);

  // Subscribe to player selection updates
  useEffect(() => {
    const channel = supabase
      .channel("selected_player")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          if (payload.new.is_selected) {
            const selectedPlayer = players.find(p => p.id === payload.new.id);
            if (selectedPlayer) {
              setSelectedPlayer(selectedPlayer);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, players]);

  const startSpinAnimation = async () => {
    if (availableActions.length === 0) {
      toast({
        title: "Fin de la partie !",
        description: "Toutes les actions ont été réalisées.",
      });
      return;
    }

    setCountdown(5);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // After 5 seconds, select the final player and action
    setTimeout(async () => {
      const finalIndex = Math.floor(Math.random() * players.length);
      const finalPlayer = players[finalIndex];
      const nextAction = availableActions[0];

      // Update player selection in database
      const { error: updatePlayerError } = await supabase
        .from("players")
        .update({ is_selected: true })
        .eq("id", finalPlayer.id);

      if (!updatePlayerError) {
        setSelectedPlayer(finalPlayer);
        setCurrentAction(nextAction);
        setIsSpinning(false);

        // Mark action as used
        const { error: updateActionError } = await supabase
          .from("player_actions")
          .update({ used: true })
          .eq("id", nextAction.id);

        if (!updateActionError) {
          setAvailableActions(prev => prev.slice(1));
        }

        toast({
          title: "Joueur sélectionné !",
          description: `${finalPlayer.username} a été choisi !`,
        });
      }
    }, 5000);
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    startSpinAnimation();
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
              <AnimatePresence mode="wait">
                {countdown !== null ? (
                  <motion.div
                    key="countdown"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-4xl font-bold text-[#F97316]">
                      {countdown}
                    </span>
                  </motion.div>
                ) : selectedPlayer ? (
                  <motion.div
                    key={selectedPlayer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-2xl font-bold text-[#F97316]">
                      {selectedPlayer.username}
                    </span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {currentAction && (
              <div className="mt-4 p-4 bg-white rounded-xl border-2 border-[#F97316]">
                <p className="text-xl text-[#F97316]">{currentAction.action_text}</p>
              </div>
            )}

            <Button
              onClick={handleSpin}
              disabled={isSpinning || availableActions.length === 0}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white text-xl py-6 px-12"
            >
              {isSpinning ? "En cours..." : availableActions.length === 0 ? "Partie terminée" : "Tourner !"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};