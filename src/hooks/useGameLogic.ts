import { useState, useEffect } from "react";
import { Player, PlayerAction } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";
import { useSpinAnimation } from "./useSpinAnimation";
import { usePlayerSelection } from "./usePlayerSelection";

export const useGameLogic = (roomId: string, players: Player[]) => {
  const [availableActions, setAvailableActions] = useState<PlayerAction[]>([]);
  const {
    isSpinning,
    setIsSpinning,
    countdown,
    setCountdown,
    startSpinAnimation
  } = useSpinAnimation(roomId);

  const {
    selectedPlayer,
    setSelectedPlayer,
    currentAction,
    setCurrentAction,
    selectPlayer,
    cleanupGameData
  } = usePlayerSelection(roomId, players);

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
          if (payload.new.animation_state === 'spinning') {
            setIsSpinning(true);
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
          } else if (payload.new.animation_state === 'idle') {
            setIsSpinning(false);
            setCountdown(null);
          }

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
  }, [roomId, players, setIsSpinning, setCountdown]);

  const handleSpin = async () => {
    if (availableActions.length === 0) {
      await cleanupGameData();
      return false;
    }

    const success = await startSpinAnimation();
    if (!success) return false;

    setTimeout(async () => {
      const finalIndex = Math.floor(Math.random() * players.length);
      const finalPlayer = players[finalIndex];
      const nextAction = availableActions[0];

      await selectPlayer(finalPlayer, nextAction);
    }, 5000);

    return true;
  };

  return {
    isSpinning,
    setIsSpinning,
    selectedPlayer,
    countdown,
    currentAction,
    availableActions,
    startSpinAnimation: handleSpin
  };
};