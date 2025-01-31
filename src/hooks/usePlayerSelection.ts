import { useState } from "react";
import { Player, PlayerAction } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const usePlayerSelection = (roomId: string, players: Player[]) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [currentAction, setCurrentAction] = useState<PlayerAction | null>(null);
  const navigate = useNavigate();

  const selectPlayer = async (finalPlayer: Player, nextAction: PlayerAction) => {
    try {
      const { error: updateError } = await supabase
        .from("game_state")
        .update({ 
          current_player_id: finalPlayer.id,
          current_action_id: nextAction.id,
          animation_state: 'idle'
        })
        .eq("room_id", roomId);

      if (updateError) throw updateError;

      await supabase
        .from("players")
        .update({ is_selected: true })
        .eq("id", finalPlayer.id);

      await supabase
        .from("player_actions")
        .update({ used: true })
        .eq("id", nextAction.id);

    } catch (error) {
      console.error("Error selecting player:", error);
    }
  };

  const cleanupGameData = async () => {
    try {
      console.log("Starting cleanup for room:", roomId);
      
      // Delete data in order to respect foreign key constraints
      await supabase
        .from("game_state")
        .delete()
        .eq("room_id", roomId);

      await supabase
        .from("player_actions")
        .delete()
        .eq("room_id", roomId);

      await supabase
        .from("players")
        .delete()
        .eq("room_id", roomId);

      // Make sure to delete the room last
      const { error: roomError } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

      if (roomError) {
        console.error("Error deleting room:", roomError);
        throw roomError;
      }

      console.log("Cleanup completed successfully");
      
      // Navigate to home page
      navigate("/");
    } catch (error) {
      console.error("Error cleaning up game data:", error);
      throw error;
    }
  };

  return {
    selectedPlayer,
    setSelectedPlayer,
    currentAction,
    setCurrentAction,
    selectPlayer,
    cleanupGameData
  };
};