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

    console.log("Setting up real-time updates for room:", roomId);
    console.log("Current players:", players);

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
          console.log("Received player update:", payload);

          if (payload.eventType === "INSERT") {
            const newPlayer = payload.new as Player;
            const updatedPlayers = [...players, newPlayer];
            console.log("Adding new player:", newPlayer);
            console.log("Updated players list:", updatedPlayers);
            setPlayers(updatedPlayers);
            
            toast({
              title: "Nouveau joueur",
              description: `${newPlayer.username} a rejoint la salle !`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedPlayers = players.map((player) =>
              player.id === payload.new.id ? { ...player, ...payload.new } : player
            );
            console.log("Updating player:", payload.new);
            console.log("Updated players list:", updatedPlayers);
            setPlayers(updatedPlayers);

            if (updatedPlayers.every((p) => p.has_submitted) && roomStatus === "playing") {
              console.log("All players have submitted their actions");
              onAllPlayersSubmitted();
            }
          } else if (payload.eventType === "DELETE") {
            const updatedPlayers = players.filter(
              (player) => player.id !== payload.old.id
            );
            console.log("Removing player:", payload.old);
            console.log("Updated players list:", updatedPlayers);
            setPlayers(updatedPlayers);
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
          console.log("Room status update:", payload);
          if (payload.new.status !== roomStatus) {
            setRoomStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [roomId, setPlayers, setRoomStatus, players, roomStatus, toast, onAllPlayersSubmitted]);
};