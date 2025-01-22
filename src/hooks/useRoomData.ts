import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/game";

export const useRoomData = (code: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState("waiting");
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        if (!code) return;
        
        // First, get the room data
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("code", code)
          .maybeSingle();

        if (roomError) {
          console.error("Error fetching room:", roomError);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de trouver la salle.",
          });
          navigate("/");
          return;
        }

        if (!room) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Salle introuvable.",
          });
          navigate("/");
          return;
        }
        
        setRoomId(room.id);
        setRoomStatus(room.status);

        const storedPlayerId = localStorage.getItem(`player_id_${room.id}`);
        if (!storedPlayerId) {
          navigate("/");
          return;
        }

        // Then, get the current player data
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select()
          .eq("id", storedPlayerId)
          .eq("room_id", room.id)
          .maybeSingle();

        if (playerError || !playerData) {
          console.error("Error fetching player:", playerError);
          localStorage.removeItem(`player_id_${room.id}`);
          navigate("/");
          return;
        }

        setCurrentPlayerId(storedPlayerId);

        // Finally, get all players in the room
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select()
          .eq("room_id", room.id);

        if (playersError) {
          console.error("Error fetching players:", playersError);
          throw playersError;
        }

        console.log("Initial players data:", playersData);
        setPlayers(playersData || []);
      } catch (error) {
        console.error("Error in fetchRoom:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de rejoindre la salle.",
        });
        navigate("/");
      }
    };

    fetchRoom();
  }, [code, navigate, toast]);

  return { players, roomId, roomStatus, currentPlayerId };
};