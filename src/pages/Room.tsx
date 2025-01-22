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

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  if (roomStatus === "waiting") {
    return <WaitingRoom code={code || ""} players={players} onStartGame={startGame} />;
  }

  if (roomStatus === "playing" && !currentPlayer?.has_submitted) {
    return (
      <ActionForm
        onSubmit={submitActions}
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