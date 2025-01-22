import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomData } from "./useRoomData";
import { useRealTimeUpdates } from "./useRealTimeUpdates";
import { useGameState } from "./useGameState";
import { Player } from "@/types/game";

export const useRoomState = (code: string | undefined) => {
  const navigate = useNavigate();
  const [submittedCount, setSubmittedCount] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomStatus, setRoomStatus] = useState("waiting");

  const { roomId, currentPlayerId } = useRoomData(code);
  const { actions, remainingActions, startGame, handleNextRound, fetchActions } = useGameState(roomId);

  // Handle when all players have submitted their actions
  const handleAllPlayersSubmitted = async () => {
    if (roomId) {
      await fetchActions();
    }
  };

  useRealTimeUpdates(
    roomId,
    setPlayers,
    setRoomStatus,
    players,
    roomStatus,
    handleAllPlayersSubmitted
  );

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