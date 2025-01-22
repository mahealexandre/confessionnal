import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/game";

export const useRealTimeUpdates = (
  roomId: string | null,
  setPlayers: (players: Player[]) => void,
  setRoomStatus: (status: string) => void,
  players: Player[],
  roomStatus: string,
  onAllPlayersSubmitted: () => void
) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!roomId) return;

    // Initial fetch of players
    const fetchPlayers = async () => {
      const { data: initialPlayers } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId);
      
      if (initialPlayers) {
        setPlayers(initialPlayers);
      }
    };

    fetchPlayers();

    const channel = supabase
      .channel("room_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Player change detected:", payload);

          if (payload.eventType === "INSERT") {
            const newPlayer = payload.new as Player;
            const updatedPlayers = [...players, newPlayer];
            setPlayers(updatedPlayers);
            
            toast({
              title: "Nouveau joueur",
              description: `${newPlayer.username} a rejoint la salle !`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedPlayer = payload.new as Player;
            const updatedPlayers = players.map((player) =>
              player.id === updatedPlayer.id ? { ...player, ...updatedPlayer } : player
            );
            setPlayers(updatedPlayers);

            if (updatedPlayers.every((p) => p.has_submitted) && roomStatus === "playing") {
              onAllPlayersSubmitted();
            }
          } else if (payload.eventType === "DELETE") {
            const deletedPlayer = payload.old as Player;
            const remainingPlayers = players.filter(
              (player) => player.id !== deletedPlayer.id
            );
            setPlayers(remainingPlayers);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new.status !== roomStatus) {
            setRoomStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, setPlayers, setRoomStatus, players, roomStatus, toast, onAllPlayersSubmitted]);
};