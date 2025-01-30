import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Player } from "@/types/game";
import { useIsMobile } from "@/hooks/use-mobile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WaitingRoomProps {
  code: string;
  players: Player[];
  onStartGame: () => void;
}

export const WaitingRoom = ({ code, players, onStartGame }: WaitingRoomProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [difficulty, setDifficulty] = useState<string>("sober");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [jokerInfo, setJokerInfo] = useState<string>("1 joker disponible, aucun coût");
  const [healthWarning, setHealthWarning] = useState<string>("");

  useEffect(() => {
    const fetchRoomId = async () => {
      try {
        const { data: room } = await supabase
          .from("rooms")
          .select("id")
          .eq("code", code)
          .single();
        
        if (room) {
          setRoomId(room.id);
          
          const { data: gameState, error: fetchError } = await supabase
            .from("game_state")
            .select("difficulty, joker_info, health_warning")
            .eq("room_id", room.id)
            .maybeSingle();
          
          if (fetchError) {
            throw fetchError;
          }

          if (!gameState) {
            const initialDifficulty = "sober";
            await supabase
              .from("game_state")
              .insert([{ 
                room_id: room.id,
                difficulty: initialDifficulty,
                joker_penalty: "none",
                joker_info: "1 joker disponible, aucun coût",
                health_warning: "" 
              }]);

            setDifficulty(initialDifficulty);
          } else {
            setDifficulty(gameState.difficulty || "sober");
            setJokerInfo(gameState.joker_info || "1 joker disponible, aucun coût");
            setHealthWarning(gameState.health_warning || "");
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          description: "Erreur lors de l'initialisation de la partie",
        });
      }
    };

    fetchRoomId();
  }, [code, toast]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel("game_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_state",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          const { new: updatedData } = payload;
          if (updatedData.difficulty) {
            setDifficulty(updatedData.difficulty);
          }
          if (updatedData.joker_info) {
            setJokerInfo(updatedData.joker_info);
          }
          if (updatedData.health_warning) {
            setHealthWarning(updatedData.health_warning);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const handleDifficultyChange = async (value: string) => {
    if (!value || !roomId) return;

    try {
      if (!['sober', 'easy', 'hard'].includes(value)) {
        return;
      }

      const jokerPenalty = value === 'easy' ? 'sips' : value === 'hard' ? 'shot' : 'none';
      const jokerInfo = value === 'sober' ? "1 joker disponible, aucun coût" : value === 'easy' ? "3 jokers disponibles, coût : 3 gorgées" : "3 jokers disponibles, coût : 1 cul-sec";
      const healthWarning = value === 'sober' ? "" : "L'abus d'alcool est dangereux pour la santé, à consommer avec modération";

      await supabase
        .from("game_state")
        .update({ 
          difficulty: value,
          joker_penalty: jokerPenalty,
          joker_info: jokerInfo,
          health_warning: healthWarning
        })
        .eq("room_id", roomId);

      const jokersCount = value === 'sober' ? 1 : 3;
      await supabase
        .from("players")
        .update({ jokers_count: jokersCount })
        .eq("room_id", roomId);

      toast({
        description: "Difficulté mise à jour !",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Erreur lors de la mise à jour de la difficulté",
      });
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4 flex items-center">
      <div className={`max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl ${isMobile ? 'w-full' : ''}`}>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#ff3aa7]">
            Salle d'attente ⏳
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-600">Code de la salle:</p>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(code || "");
                toast({
                  description: "Code copié !",
                });
              }}
            >
              {code}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Joueurs 👥​</h2>
          <div className="grid gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
              >
                <span className="font-medium">{player.username}</span>
                {player.is_host && (
                  <span className="text-sm text-[#2E1F47]">Hôte</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Difficulté 🎯</h2>
          <ToggleGroup
            type="single"
            value={difficulty}
            onValueChange={handleDifficultyChange}
            className="justify-center"
          >
            <ToggleGroupItem value="sober" aria-label="Sans alcool" className="text-3xl">
              🙂
            </ToggleGroupItem>
            <ToggleGroupItem value="easy" aria-label="Easy" className="text-3xl">
              😳
            </ToggleGroupItem>
            <ToggleGroupItem value="hard" aria-label="Hard" className="text-3xl">
              😵‍💫
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Rappel des jokers */}
          <p className="text-sm text-center text-gray-600 mt-2">{jokerInfo}</p>

          {healthWarning && (
            <p className="text-sm text-center text-red-600 italic mt-2">
              {healthWarning}
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onStartGame}
            className="bg-[#ff3aa7] hover:bg-[#b40064]/90 text-white"
          >
            Lancer la partie
          </Button>
        </div>
      </div>
    </div>
  );
};
