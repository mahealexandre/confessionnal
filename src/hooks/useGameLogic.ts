import { useState, useEffect } from "react";
import { Player, PlayerAction } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";

export const useGameLogic = (roomId: string, players: Player[]) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentAction, setCurrentAction] = useState<PlayerAction | null>(null);
  const [availableActions, setAvailableActions] = useState<PlayerAction[]>([]);

  useEffect(() => {
    const initializeActions = async () => {
      try {
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
        console.error("Error fetching actions:", error);
      }
    };

    initializeActions();
  }, [roomId]);

  useEffect(() => {
    const channel = supabase
      .channel("game_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          if (payload.new.is_selected) {
            const selectedPlayer = players.find(p => p.id === payload.new.id);
            if (selectedPlayer) {
              setSelectedPlayer(selectedPlayer);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_state",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload: any) => {
          if (payload.new.current_action_id) {
            try {
              const { data: action, error } = await supabase
                .from("player_actions")
                .select("*")
                .eq("id", payload.new.current_action_id)
                .single();
              
              if (error) throw error;
              
              if (action) {
                setCurrentAction(action);
                setAvailableActions(prev => prev.filter(a => a.id !== action.id));
              }
            } catch (error) {
              console.error("Error fetching current action:", error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, players]);

  const startSpinAnimation = async () => {
    if (availableActions.length === 0) {
      return false;
    }

    setCountdown(5);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      setTimeout(async () => {
        const finalIndex = Math.floor(Math.random() * players.length);
        const finalPlayer = players[finalIndex];
        const nextAction = availableActions[0];

        const { error: updateError } = await supabase
          .from("game_state")
          .update({ 
            current_player_id: finalPlayer.id,
            current_action_id: nextAction.id
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

        setIsSpinning(false);
      }, 5000);

      return true;
    } catch (error) {
      console.error("Error during spin animation:", error);
      setIsSpinning(false);
      return false;
    }
  };

  return {
    isSpinning,
    setIsSpinning,
    selectedPlayer,
    countdown,
    currentAction,
    availableActions,
    startSpinAnimation
  };
};