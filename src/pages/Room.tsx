import { useParams } from "react-router-dom";
import { WaitingRoom } from "@/components/room/WaitingRoom";
import { ActionForm } from "@/components/room/ActionForm";
import { GameRound } from "@/components/room/GameRound";
import { useRoomState } from "@/hooks/useRoomState";
import { useActionSubmission } from "@/hooks/useActionSubmission";

const Room = () => {
  const { code } = useParams();
  const {
    players,
    roomStatus,
    currentPlayerId,
    submittedCount,
    remainingActions,
    startGame,
    handleNextRound,
  } = useRoomState(code);

  const { submitActions } = useActionSubmission(currentPlayerId, code);

  // Find the current player to check their submission status
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  console.log("Room status:", roomStatus);
  console.log("Current player:", currentPlayer);
  console.log("Players:", players);

  if (!code) return null;

  // Show waiting room when status is "waiting"
  if (roomStatus === "waiting") {
    return (
      <WaitingRoom 
        code={code} 
        players={players} 
        onStartGame={startGame} 
      />
    );
  }

  // Show action form when the game is playing and player hasn't submitted
  if (roomStatus === "playing" && !currentPlayer?.has_submitted) {
    return (
      <ActionForm
        onSubmit={submitActions}
        submittedCount={submittedCount}
        totalPlayers={players.length}
      />
    );
  }

  // Show game round when all players have submitted
  if (roomStatus === "playing" && currentPlayer?.has_submitted) {
    return (
      <GameRound
        players={players}
        actions={remainingActions}
        onNextRound={handleNextRound}
      />
    );
  }

  // Fallback to waiting room
  return (
    <WaitingRoom 
      code={code} 
      players={players} 
      onStartGame={startGame} 
    />
  );
};

export default Room;