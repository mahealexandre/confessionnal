import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WaitingRoom } from "@/components/room/WaitingRoom";
import { ActionForm } from "@/components/room/ActionForm";
import { GameRound } from "@/components/room/GameRound";
import { Player } from "@/types/game";

const Room = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState("waiting");
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [actions, setActions] = useState<any[]>([]);
  const [remainingActions, setRemainingActions] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select()
          .eq("code", code)
          .single();

        if (roomError) throw roomError;
        setRoomId(room.id);
        setRoomStatus(room.status);

        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select()
          .eq("room_id", room.id);

        if (playersError) throw playersError;
        setPlayers(playersData);
        
        const currentPlayer = playersData.find(
          (p) => p.id === localStorage.getItem("playerId")
        );
        if (currentPlayer) {
          setCurrentPlayerId(currentPlayer.id);
        }

        if (room.status === "playing") {
          const { data: actionsData } = await supabase
            .from("player_actions")
            .select()
            .eq("room_id", room.id);
          
          if (actionsData) {
            setActions(actionsData);
            setRemainingActions(actionsData);
          }
        }
      } catch (error) {
        console.error("Error fetching room:", error);
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

            // Vérifier si tous les joueurs ont soumis leurs actions
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

  const startGame = async () => {
    if (!roomId) return;
    
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

  const onSubmit = async (values: { actions: string[] }) => {
    try {
      const promises = values.actions.map((action) =>
        supabase
          .from("player_actions")
          .insert({ player_id: currentPlayerId, action_text: action, room_id: roomId })
      );

      await Promise.all(promises);

      await supabase
        .from("players")
        .update({ has_submitted: true })
        .eq("id", currentPlayerId);

      toast({
        title: "Actions soumises !",
        description: "Vos actions ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Error submitting actions:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de soumettre vos actions.",
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
    const submittedPlayers = players.filter((p) => p.has_submitted).length;
    setSubmittedCount(submittedPlayers);
  }, [players]);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  if (roomStatus === "waiting") {
    return <WaitingRoom code={code || ""} players={players} onStartGame={startGame} />;
  }

  if (roomStatus === "playing" && !currentPlayer?.has_submitted) {
    return (
      <ActionForm
        onSubmit={onSubmit}
        submittedCount={submittedCount}
        totalPlayers={players.length}
      />
    );
  }

  return (
    <GameRound
      players={players}
      actions={remainingActions}
      onNextRound={handleNextRound}
    />
  );
};

export default Room;