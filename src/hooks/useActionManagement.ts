import { useState, useEffect } from "react";
import { PlayerAction } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";

export const useActionManagement = (roomId: string) => {
  const [availableActions, setAvailableActions] = useState<PlayerAction[]>([]);

  useEffect(() => {
    const initializeActions = async () => {
      try {
        // First, ensure game state exists with valid difficulty
        const { data: existingGameState, error: fetchError } = await supabase
          .from("game_state")
          .select("*")
          .eq("room_id", roomId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        // If no game state exists, create one with default values
        if (!existingGameState) {
          const { error: createError } = await supabase
            .from("game_state")
            .insert([
              { 
                room_id: roomId,
                difficulty: 'sober',
                animation_state: "idle",
                joker_penalty: "none"
              }
            ]);
          
          if (createError) {
            console.error("Error creating game state:", createError);
            throw createError;
          }
        }

        // Then fetch actions
        const { data: actions, error } = await supabase
          .from("player_actions")
          .select("*")
          .eq("room_id", roomId)
          .eq("used", false);

        if (error) throw error;

        if (actions) {
          const shuffledActions = [...actions].sort(() => Math.random() - 0.5);
          setAvailableActions(shuffledActions);
        }
      } catch (error) {
        console.error("Error initializing game:", error);
      }
    };

    initializeActions();
  }, [roomId]);

  return {
    availableActions,
    setAvailableActions
  };
};