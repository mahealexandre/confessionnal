import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/game";

export const useRoomState = (code: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState("waiting");
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [actions, setActions] = useState<any[]>([]);
  const [remainingActions, setRemainingActions] = useState<any[]>([]);

  const startGame = async () => {
    if (!roomId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de démarrer la partie : ID de salle manquant.",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ status: "playing" })
        .eq("id", roomId);

      if (error) throw error;

      toast({
        title: "Partie lancée !",
        description: "Tous les joueurs peuvent maintenant saisir leurs actions.",
      });
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de lancer la partie.",
      });
    }
  };

  const handleNextRound = () => {
    if (remainingActions.length > 0) {
      setRemainingActions((current) => current.slice(1));
    } else {
      toast({
        title: "Partie terminée !",
        description: "Toutes les actions ont été réalisées.",
      });
      navigate("/");
    }
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        if (!code) return;
        
        // First fetch room by code to get its UUID
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("code", code)
          .single();

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

        // Get stored player ID
        const storedPlayerId = localStorage.getItem(`player_id_${room.id}`);
        if (!storedPlayerId) {
          navigate("/");
          return;
        }

        // Verify if the player exists in the room
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select()
          .eq("id", storedPlayerId)
          .eq("room_id", room.id)
          .single();

        if (playerError || !playerData) {
          localStorage.removeItem(`player_id_${room.id}`);
          navigate("/");
          return;
        }

        setCurrentPlayerId(storedPlayerId);

        // Fetch players in room
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select()
          .eq("room_id", room.id);

        if (playersError) throw playersError;
        setPlayers(playersData || []);

        // Only fetch actions if room is in playing state
        if (room.status === "playing") {
          const { data: actionsData, error: actionsError } = await supabase
            .from("player_actions")
            .select()
            .eq("room_id", room.id);

          if (actionsError) throw actionsError;
          if (actionsData) {
            setActions(actionsData);
            setRemainingActions(actionsData);
          }
        }
      } catch (error) {
        console.error("Error fetching room:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de rejoindre la salle.",
        });
        navigate("/");
      }
    };

    fetchRoom();

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
            setPlayers((current) => [...current, payload.new as Player]);
            toast({
              title: "Nouveau joueur",
              description: `${payload.new.username} a rejoint la salle !`,
            });
          } else if (payload.eventType === "UPDATE") {
            setPlayers((current) =>
              current.map((player) =>
                player.id === payload.new.id ? { ...player, ...payload.new } : player
              )
            );

            const updatedPlayers = players.map((player) =>
              player.id === payload.new.id ? { ...player, ...payload.new } : player
            );
            const allSubmitted = updatedPlayers.every((p) => p.has_submitted);
            
            if (allSubmitted && roomStatus === "playing") {
              startGame();
            }
          } else if (payload.eventType === "DELETE") {
            setPlayers((current) =>
              current.filter((player) => player.id !== payload.old.id)
            );
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
  }, [code, navigate, roomId, toast, roomStatus, players]);

  useEffect(() => {
    const submittedPlayers = players.filter((p) => p.has_submitted).length;
    setSubmittedCount(submittedPlayers);
  }, [players]);

  return {
    players,
    roomStatus,
    currentPlayerId,
    submittedCount,
    remainingActions,
    startGame,
    handleNextRound,
  };
};