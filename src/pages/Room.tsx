import { useParams } from "react-router-dom";
import { WaitingRoom } from "@/components/room/WaitingRoom";
import { ActionForm } from "@/components/room/ActionForm";
import { useRoomState } from "@/hooks/useRoomState";

const Room = () => {
  const { code } = useParams();
  const {
    players,
    roomStatus,
    currentPlayerId,
    submittedCount,
    startGame,
  } = useRoomState(code);

  console.log("Current room status:", roomStatus); // Debug log

  if (!code) return null;

  // Show action form when room status is "playing"
  if (roomStatus === "playing") {
    return (
      <ActionForm
        onSubmit={(values) => {
          console.log("Submitting actions:", values);
          // Handle action submission here
        }}
        submittedCount={submittedCount}
        totalPlayers={players.length}
      />
    );
  }

  // Show waiting room by default
  return (
    <WaitingRoom
      code={code}
      players={players}
      onStartGame={startGame}
    />
  );
};

export default Room;