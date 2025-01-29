import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { useGameLogic } from "@/hooks/useGameLogic";
import { PlayerDisplay } from "./PlayerDisplay";
import { ActionDisplay } from "./ActionDisplay";

interface SpinGameProps {
  players: Player[];
  roomId: string;
}

export const SpinGame = ({ players, roomId }: SpinGameProps) => {
  const {
    isSpinning,
    setIsSpinning,
    selectedPlayer,
    countdown,
    currentAction,
    availableActions,
    startSpinAnimation,
    cleanupGameData
  } = useGameLogic(roomId, players);

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const success = await startSpinAnimation();
    if (!success) {
      setIsSpinning(false);
    }
  };

  const handleStopGame = async () => {
    await cleanupGameData();
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4 flex items-center">
      <div className="max-w-2xl mx-auto space-y-8 w-full">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-[#2E1F47]">
              À qui le tour ? <span className="text-black">😈</span>
            </h1>

            <PlayerDisplay
              selectedPlayer={selectedPlayer}
              countdown={countdown}
              players={players}
            />

            <ActionDisplay currentAction={currentAction} />

            <div className="space-y-4 w-full">
              <div className="w-full">
                <Button
                  onClick={handleSpin}
                  disabled={isSpinning || availableActions.length === 0}
                  className="w-full bg-[#2E1F47] hover:bg-[#000000]/90 text-white text-xl py-6"
                >
                  {isSpinning 
                    ? "En cours..." 
                    : availableActions.length === 0 
                      ? "Partie terminée" 
                      : "Lancer !"}
                </Button>
              </div>

              <div className="w-full">
                <Button
                  onClick={handleStopGame}
                  variant="outline"
                  className="w-full"
                >
                  Arrêter la partie
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
