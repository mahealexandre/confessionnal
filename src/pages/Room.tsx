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

        const storedUsername = localStorage.getItem('username');
        console.log("Stored username:", storedUsername);

        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select()
          .eq("room_id", room.id);

        if (playersError) throw playersError;

        setPlayers(playersData);
        
        const currentPlayer = playersData.find(p => p.username === storedUsername);
        
        if (currentPlayer) {
          console.log("Found player:", currentPlayer);
          localStorage.setItem(`player_id_${room.id}`, currentPlayer.id);
          setCurrentPlayerId(currentPlayer.id);
        }

        const submittedPlayers = playersData.filter(p => p.has_submitted).length;
        console.log("Initial submitted count:", submittedPlayers);
        setSubmittedCount(submittedPlayers);
        
        if (submittedPlayers === playersData.length && submittedPlayers > 0) {
          console.log("All players have submitted, updating room status to playing");
          const { error: updateError } = await supabase
            .from("rooms")
            .update({ status: "playing" })
            .eq("id", room.id);

          if (updateError) throw updateError;
          setRoomStatus("playing");
        }

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

    if (code) {
      fetchRoom();
    }

    // Enable REPLICA IDENTITY FULL for the players table to ensure complete row data
    const playersChannel = supabase
      .channel('players_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
        },
        async (payload) => {
          console.log("Players change detected:", payload);
          
          if (!roomId) return;

          const { data: playersData } = await supabase
            .from("players")
            .select()
            .eq("room_id", roomId);

          if (playersData) {
            setPlayers(playersData);
            const newSubmittedCount = playersData.filter(p => p.has_submitted).length;
            console.log(`Updated submitted count: ${newSubmittedCount}/${playersData.length}`);
            setSubmittedCount(newSubmittedCount);

            if (newSubmittedCount === playersData.length && newSubmittedCount > 0) {
              console.log("All players have submitted, starting game...");
              const { error: updateError } = await supabase
                .from("rooms")
                .update({ status: "playing" })
                .eq("id", roomId);

              if (!updateError) {
                setRoomStatus("playing");
                
                const { data: actionsData } = await supabase
                  .from("player_actions")
                  .select()
                  .eq("room_id", roomId);

                if (actionsData) {
                  setActions(actionsData);
                  setRemainingActions(actionsData);
                }
              }
            }
          }
        }
      )
      .subscribe();

    const roomChannel = supabase
      .channel('room_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Room status changed:", payload.new.status);
          setRoomStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [code, navigate, roomId, toast]);

  const handleStartGame = async () => {
    try {
      if (!roomId) return;

      const { error: updateError } = await supabase
        .from("rooms")
        .update({ status: "submitting" })
        .eq("id", roomId);

      if (updateError) throw updateError;

      setRoomStatus("submitting");
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de démarrer la partie.",
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

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  if (roomStatus === "waiting") {
    return (
      <WaitingRoom 
        code={code || ""} 
        players={players} 
        onStartGame={handleStartGame}
      />
    );
  }

  if (roomStatus === "submitting" && !currentPlayer?.has_submitted) {
    return (
      <ActionForm
        submittedCount={submittedCount}
        totalPlayers={players.length}
      />
    );
  }

  if (roomStatus === "playing") {
    return (
      <GameRound
        players={players}
        actions={remainingActions}
        onNextRound={handleNextRound}
      />
    );
  }

  return null;
};

export default Room;
