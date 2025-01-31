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
            .select("difficulty, joker_info, health_warning")
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
                  joker_penalty: "none",
                  joker_info: "1 joker disponible, aucun coût",
                  health_warning: ""
                }
              ]);
            
            if (insertError) {
              console.error("Insert error:", insertError);
              throw insertError;
            }
            setDifficulty(initialDifficulty);
            setJokerInfo("1 joker disponible, aucun coût");
            setHealthWarning("");
          } else {
            console.log("Setting state from existing game state:", gameState);
            setDifficulty(gameState.difficulty);
            setJokerInfo(gameState.joker_info);
            setHealthWarning(gameState.health_warning);
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
          if (payload.new.joker_info) {
            setJokerInfo(payload.new.joker_info);
          }
          if (payload.new.health_warning) {
            setHealthWarning(payload.new.health_warning);
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

      let newJokerInfo = "1 joker disponible, aucun coût";
      let newHealthWarning = "";
      const jokerPenalty = value === 'easy' ? 'sips' : value === 'hard' ? 'shot' : 'none';

      if (value === 'easy') {
        newJokerInfo = "3 jokers disponibles, coût : 3 gorgées";
        newHealthWarning = "L'abus d'alcool est dangereux pour la santé, à consommer avec modération";
      } else if (value === 'hard') {
        newJokerInfo = "3 jokers disponibles, coût : 1 cul-sec";
        newHealthWarning = "L'abus d'alcool est dangereux pour la santé, à consommer avec modération";
      }

      const { error: gameStateError } = await supabase
        .from("game_state")
        .update({ 
          difficulty: value,
          joker_penalty: jokerPenalty,
          joker_info: newJokerInfo,
          health_warning: newHealthWarning
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
        duration: 3000,
      });

    } catch (error) {
      console.error("Error updating difficulty:", error);
      toast({
        variant: "destructive",
        description: "Erreur lors de la mise à jour de la difficulté",
        duration: 3000,
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
                  duration: 3000,
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
        
          <div className="mt-4">
            <p className="text-sm text-center text-gray-600">{jokerInfo}</p>
            {healthWarning && (
              <p className="text-sm text-center text-red-600 italic">{healthWarning}</p>
            )}
          </div>
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