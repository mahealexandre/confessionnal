import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useGameState = (roomId: string | null) => {
  const { toast } = useToast();
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
      // Get the room first to check its current status
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("status")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      // Only update if the room is in waiting status
      if (room.status === "waiting") {
        const { error } = await supabase
          .from("rooms")
          .update({ status: "playing" })
          .eq("id", roomId);

        if (error) throw error;

        toast({
          title: "Partie lancée !",
          description: "Tous les joueurs peuvent maintenant saisir leurs actions.",
        });

        console.log("Game started successfully, room status updated to playing");
      } else {
        console.log("Room is already in status:", room.status);
      }
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
    }
  };

  const fetchActions = async () => {
    if (!roomId) return;

    try {
      const { data: actionsData, error: actionsError } = await supabase
        .from("player_actions")
        .select()
        .eq("room_id", roomId);

      if (actionsError) throw actionsError;
      if (actionsData) {
        console.log("Fetched actions:", actionsData);
        setActions(actionsData);
        setRemainingActions(actionsData);
      }
    } catch (error) {
      console.error("Error fetching actions:", error);
    }
  };

  return {
    actions,
    remainingActions,
    startGame,
    handleNextRound,
    fetchActions,
  };
};