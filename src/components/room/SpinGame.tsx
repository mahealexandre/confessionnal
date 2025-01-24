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
  player_id: string;
}

export const SpinGame = ({ players, roomId }: SpinGameProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [actions, setActions] = useState<PlayerAction[]>([]);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch and shuffle actions when component mounts
  useEffect(() => {
    const fetchAndShuffleActions = async () => {
      const { data, error } = await supabase
        .from("player_actions")
        .select("*")
        .eq("room_id", roomId)
        .eq("used", false);

      if (!error && data) {
        // Shuffle the actions using Fisher-Yates algorithm
        const shuffledActions = [...data];
        for (let i = shuffledActions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledActions[i], shuffledActions[j]] = [shuffledActions[j], shuffledActions[i]];
        }
        setActions(shuffledActions);
      }
    };

    fetchAndShuffleActions();
  }, [roomId]);

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
    setCountdown(5);
    setCurrentAction(null);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(async () => {
      const finalIndex = Math.floor(Math.random() * players.length);
      const finalPlayer = players[finalIndex];

      // Select a random unused action
      if (actions.length > 0) {
        const action = actions[0];
        setCurrentAction(action.action_text);
        
        // Mark the action as used
        await supabase
          .from("player_actions")
          .update({ used: true })
          .eq("id", action.id);

        // Remove the used action from our local state
        setActions(prevActions => prevActions.slice(1));
      }

      const { error: updateError } = await supabase
        .from("players")
        .update({ is_selected: true })
        .eq("id", finalPlayer.id);

      if (!updateError) {
        setSelectedPlayer(finalPlayer);
        setIsSpinning(false);
      }
    }, 5000);
  };

  const handleSpin = async () => {
    if (isSpinning) return;

    // Reset previous player selection
    if (selectedPlayer) {
      await supabase
        .from("players")
        .update({ is_selected: false })
        .eq("id", selectedPlayer.id);
      setSelectedPlayer(null);
    }

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
                    className="absolute inset-0 flex flex-col items-center justify-center space-y-2"
                  >
                    <span className="text-2xl font-bold text-[#F97316]">
                      {selectedPlayer.username}
                    </span>
                    {currentAction && (
                      <span className="text-lg text-gray-600">
                        {currentAction}
                      </span>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <Button
              onClick={handleSpin}
              disabled={isSpinning || actions.length === 0}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white text-xl py-6 px-12"
            >
              {isSpinning ? "En cours..." : actions.length === 0 ? "Plus d'actions disponibles" : "Tourner !"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};