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
  const [playersData, setPlayersData] = useState<Player[]>(players);
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

    // Subscribe to player updates
    const playersChannel = supabase
      .channel("players_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          setPlayersData(prevPlayers =>
            prevPlayers.map(player =>
              player.id === payload.new.id
                ? { ...player, jokers_count: payload.new.jokers_count }
                : player
            )
          );
        }
      )
      .subscribe();

    return () => {
      playersChannel.unsubscribe();
    };
  }, [roomId]);

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const success = await startSpinAnimation();
    if (!success) {
      setIsSpinning(false);
    }
  };

  const handleUseJoker = async (playerId: string) => {
    const player = playersData.find(p => p.id === playerId);
    if (!player || player.jokers_count <= 0) return;

    try {
      const { error } = await supabase
        .from("players")
        .update({ jokers_count: player.jokers_count - 1 })
        .eq("id", player.id);

      if (error) throw error;

      setPlayersData(prevPlayers =>
        prevPlayers.map(p =>
          p.id === player.id ? { ...p, jokers_count: p.jokers_count - 1 } : p
        )
      );

      let penaltyMessage = "";
      switch (jokerPenalty) {
        case "sips":
          penaltyMessage = `${player.name}, bois 3 gorgées !`;
          break;
        case "shot":
          penaltyMessage = `${player.name}, bois un cul-sec !`;
          break;
        default:
          penaltyMessage = `${player.name} a utilisé un joker !`;
      }

      toast({
        description: penaltyMessage,
      });
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                {playersData.map(player => (
                  <Button
                    key={player.id}
                    onClick={() => handleUseJoker(player.id)}
                    disabled={player.jokers_count <= 0}
                    className="bg-[#2E1F47] hover:bg-[#2E1F47]/90 text-white text-xl py-6 flex items-center gap-2"
                  >
                    <Gem className="w-6 h-6" />
                    <span>{player.name} ({player.jokers_count})</span>
                  </Button>
                ))}
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
