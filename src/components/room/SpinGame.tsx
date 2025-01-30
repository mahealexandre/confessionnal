import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { useGameLogic } from "@/hooks/useGameLogic";
import { PlayerDisplay } from "./PlayerDisplay";
import { ActionDisplay } from "./ActionDisplay";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Gem } from "lucide-react";

interface SpinGameProps {
  players: Player[];
  roomId: string;
}

export const SpinGame = ({ players, roomId }: SpinGameProps) => {
  const { toast } = useToast();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [jokerPenalty, setJokerPenalty] = useState<string>("none");

  const {
    isSpinning,
    setIsSpinning,
    selectedPlayer,
    countdown,
    currentAction,
    availableActions,
    startSpinAnimation,
    cleanupGameData
  } = useGameLogic(roomId, players);

  useEffect(() => {
    const fetchGameState = async () => {
      const { data: gameState } = await supabase
        .from("game_state")
        .select("joker_penalty")
        .eq("room_id", roomId)
        .single();

      if (gameState) {
        setJokerPenalty(gameState.joker_penalty);
      }
    };

    fetchGameState();
  }, [roomId]);

  useEffect(() => {
    if (selectedPlayer) {
      setCurrentPlayer(selectedPlayer);
    }
  }, [selectedPlayer]);

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const success = await startSpinAnimation();
    if (!success) {
      setIsSpinning(false);
    }
  };

  const handleUseJoker = async () => {
    if (!currentPlayer || currentPlayer.jokers_count <= 0) return;

    try {
      // Met à jour le joker dans la base de données
      const { error } = await supabase
        .from("players")
        .update({ jokers_count: currentPlayer.jokers_count - 1 })
        .eq("id", currentPlayer.id);

      if (error) throw error;

      // Met à jour l'état local immédiatement
      setCurrentPlayer((prev) => prev ? { ...prev, jokers_count: prev.jokers_count - 1 } : prev);

      let penaltyMessage = "";
      switch (jokerPenalty) {
        case "sips":
          penaltyMessage = "Bois 3 gorgées !";
          break;
        case "shot":
          penaltyMessage = "Bois un cul-sec !";
          break;
        default:
          penaltyMessage = "Joker utilisé !";
      }

      toast({ description: penaltyMessage });

    } catch (error) {
      console.error("Error using joker:", error);
      toast({
        variant: "destructive",
        description: "Erreur lors de l'utilisation du joker",
      });
    }
  };

  const handleStopGame = async () => {
    await cleanupGameData();
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4 flex items-center">
      <div className="max-w-2xl mx-auto space-y-8 w-full">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-[#ff3aa7]">
              À qui le tour ? <span className="text-black">😈</span>
            </h1>

            <PlayerDisplay
              selectedPlayer={selectedPlayer}
              countdown={countdown}
              players={players}
            />

            <ActionDisplay currentAction={currentAction} />

            <div className="space-y-4 w-full">
              <div className="w-full flex gap-4">
                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || availableActions.length === 0}
                  className="flex-1 bg-[#ff3aa7] hover:bg-[#b40064]/90 text-white text-xl py-6"
                >
                  {isSpinning 
                    ? "En cours..." 
                    : availableActions.length === 0 
                      ? "Partie terminée" 
                      : "Lancer !"}
                </Button>
                
                {currentPlayer && (
                  <Button
                    onClick={handleUseJoker}
                    disabled={currentPlayer.jokers_count <= 0}
                    className="bg-[#2E1F47] hover:bg-[#2E1F47]/90 text-white text-xl py-6 flex items-center gap-2"
                  >
                    <Gem className="w-6 h-6" />
                    <span>({currentPlayer.jokers_count})</span>
                  </Button>
                )}
              </div>

              <div className="w-full">
                <Button
                  onClick={handleStopGame}
                  variant="outline"
                  className="w-full"
                >
                  Arrêter la partie
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
