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
          if (payload.eventType === "INSERT") {
            const updatedPlayers = [...players, payload.new as Player];
            setPlayers(updatedPlayers);
            toast({
              title: "Nouveau joueur",
              description: `${payload.new.username} a rejoint la salle !`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedPlayers = players.map((player) =>
              player.id === payload.new.id ? { ...player, ...payload.new } : player
            );
            setPlayers(updatedPlayers);

            // Check if all players have submitted their actions
            if (updatedPlayers.every((p) => p.has_submitted) && roomStatus === "playing") {
              onAllPlayersSubmitted();
            }
          } else if (payload.eventType === "DELETE") {
            const updatedPlayers = players.filter((player) => player.id !== payload.old.id);
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