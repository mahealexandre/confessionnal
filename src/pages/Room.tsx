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
        // Fetch room data
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select()
          .eq("code", code)
          .single();

        if (roomError) throw roomError;
        
        setRoomId(room.id);
        setRoomStatus(room.status);

        // Get stored username
        const storedUsername = localStorage.getItem('username');
        console.log("Stored username:", storedUsername);

        // Fetch players in room
        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select()
          .eq("room_id", room.id);

        if (playersError) throw playersError;

        setPlayers(playersData);
        
        // Find the player with matching username
        const currentPlayer = playersData.find(p => p.username === storedUsername);
        
        if (currentPlayer) {
          console.log("Found player:", currentPlayer);
          localStorage.setItem(`player_id_${room.id}`, currentPlayer.id);
          setCurrentPlayerId(currentPlayer.id);
        } else {
          console.log("No matching player found for username:", storedUsername);
        }

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

        // Check if all players have submitted their actions
        const submittedPlayers = playersData.filter(p => p.has_submitted).length;
        setSubmittedCount(submittedPlayers);
        
        if (submittedPlayers === playersData.length && submittedPlayers > 0) {
          // Start the game if all players have submitted
          const { error: updateError } = await supabase
            .from("rooms")
            .update({ status: "playing" })
            .eq("id", room.id);

          if (updateError) throw updateError;
          setRoomStatus("playing");
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

    // Subscribe to real-time updates
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
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newPlayer = payload.new as Player;
            setPlayers((current) => [...current, newPlayer]);
            
            // If this is our player, save the ID
            const storedUsername = localStorage.getItem('username');
            if (storedUsername === newPlayer.username) {
              console.log("Saving player ID for new player:", newPlayer.id);
              localStorage.setItem(`player_id_${roomId}`, newPlayer.id);
              setCurrentPlayerId(newPlayer.id);
            }
          } else if (payload.eventType === "UPDATE") {
            // Update players list
            setPlayers((current) =>
              current.map((player) =>
                player.id === payload.new.id ? { ...player, ...payload.new } : player
              )
            );

            // Check if all players have submitted after this update
            const { data: allPlayers } = await supabase
              .from("players")
              .select()
              .eq("room_id", roomId);

            if (allPlayers) {
              const submittedCount = allPlayers.filter(p => p.has_submitted).length;
              setSubmittedCount(submittedCount);

              // If all players have submitted, start the game
              if (submittedCount === allPlayers.length && submittedCount > 0) {
                const { error: updateError } = await supabase
                  .from("rooms")
                  .update({ status: "playing" })
                  .eq("id", roomId);

                if (!updateError) {
                  setRoomStatus("playing");
                }
              }
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
  }, [code, navigate, roomId, toast, roomStatus]);

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
    return <WaitingRoom code={code || ""} players={players} onStartGame={() => {}} />;
  }

  if (roomStatus === "playing" && !currentPlayer?.has_submitted) {
    return (
      <ActionForm
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