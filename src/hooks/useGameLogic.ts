import { useState, useEffect } from "react";
import { Player, PlayerAction } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";
import { useSpinAnimation } from "./useSpinAnimation";
import { usePlayerSelection } from "./usePlayerSelection";

export const useGameLogic = (roomId, players) => {
  const [availableActions, setAvailableActions] = useState([]);
  const [wheelItems, setWheelItems] = useState([]);
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
    if (isSpinning) {
      // Prepare wheel items (names of players)
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
      setWheelItems(shuffledPlayers.map((player) => player.name));

      const spinDuration = 5000; // 5 seconds
      const interval = setInterval(() => {
        setWheelItems((prev) => {
          const [first, ...rest] = prev;
          return [...rest, first];
        });
      }, 100);

      setTimeout(() => {
        clearInterval(interval);

        // Select final player
        const finalIndex = Math.floor(Math.random() * players.length);
        const finalPlayer = players[finalIndex];
        const nextAction = availableActions[0];

        selectPlayer(finalPlayer, nextAction);
        setIsSpinning(false);
      }, spinDuration);
    }
  }, [isSpinning, players, availableActions, selectPlayer, setIsSpinning]);

  const handleSpin = async () => {
    if (availableActions.length === 0) {
      await cleanupGameData();
      return false;
    }

    const success = await startSpinAnimation();
    if (!success) return false;

    setIsSpinning(true);
    setCountdown(5); // Keep countdown logic for timing
    return true;
  };

  return {
    isSpinning,
    setIsSpinning,
    selectedPlayer,
    countdown,
    currentAction,
    availableActions,
    wheelItems, // Expose wheel items for UI rendering
    startSpinAnimation: handleSpin,
    cleanupGameData
  };
};
