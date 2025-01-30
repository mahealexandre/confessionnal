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

  useEffect(() => {
    const fetchRoomId = async () => {
      try {
        console.log("Fetching room ID for code:", code);
        const { data: room } = await supabase
          .from("rooms")
          .select("id")
          .eq("code", code)
          .single();
        
        if (room) {
          console.log("Found room:", room);
          setRoomId(room.id);
          
          const { data: gameState, error: fetchError } = await supabase
            .from("game_state")
            .select("difficulty")
            .eq("room_id", room.id)
            .maybeSingle();
          
          console.log("Existing game state:", gameState);
          
          if (fetchError) {
            console.error("Fetch error:", fetchError);
            throw fetchError;
          }

          if (!gameState) {
            console.log("Creating new game state with difficulty: sober");
            const initialDifficulty = "sober";
            const { error: insertError } = await supabase
              .from("game_state")
              .insert([
                { 
                  room_id: room.id,
                  difficulty: initialDifficulty,
                  animation_state: "idle",
                  joker_penalty: "none"
                }
              ]);
            
            if (insertError) {
              console.error("Insert error:", insertError);
              throw insertError;
            }
            setDifficulty(initialDifficulty);
          } else if (gameState.difficulty) {
            console.log("Setting difficulty from existing game state:", gameState.difficulty);
            setDifficulty(gameState.difficulty);
          }
        }
      } catch (error) {
        console.error("Error setting up game state:", error);
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
          if (payload.new.difficulty) {
            setDifficulty(payload.new.difficulty);
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
      console.log("Updating difficulty to:", value);
      if (!['sober', 'easy', 'hard'].includes(value)) {
        console.error("Invalid difficulty value:", value);
        return;
      }

      const jokerPenalty = value === 'easy' ? 'sips' : value === 'hard' ? 'shot' : 'none';
      const { error: gameStateError } = await supabase
        .from("game_state")
        .update({ 
          difficulty: value,
          joker_penalty: jokerPenalty
        })
        .eq("room_id", roomId);

      if (gameStateError) throw gameStateError;

      const jokersCount = value === 'sober' ? 1 : 3;
      const { error: playersError } = await supabase
        .from("players")
        .update({ jokers_count: jokersCount })
        .eq("room_id", roomId);

      if (playersError) throw playersError;

      toast({
        description: "Difficulté mise à jour !",
      });

      // Mise à jour du texte informatif des jokers
      if (value === 'sober') {
        setJokerInfo("1 joker disponible, aucun coût");
      } else if (value === 'easy') {
        setJokerInfo("3 jokers disponibles, coût : gorgée");
      } else if (value === 'hard') {
        setJokerInfo("3 jokers disponibles, coût : shot");
      }

    } catch (error) {
      console.error("Error updating difficulty:", error);
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
            <ToggleGroupItem value="sober" aria-label="Sans alcool">
              Sans alcool 🙂
            </ToggleGroupItem>
            <ToggleGroupItem value="easy" aria-label="Easy">
              Léger 😳
            </ToggleGroupItem>
            <ToggleGroupItem value="hard" aria-label="Hard">
              Non recommandé 😵‍💫
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Rappel des jokers */}
          <p className="text-sm text-center text-gray-600 mt-2">{jokerInfo}</p>
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
