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
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              Qui sera le prochain ?
            </h1>

            <PlayerDisplay
              selectedPlayer={selectedPlayer}
              countdown={countdown}
            />

            <ActionDisplay currentAction={currentAction} />

            <div className="space-y-4">
              <Button
                onClick={handleSpin}
                disabled={isSpinning || availableActions.length === 0}
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white text-xl py-6 px-12"
              >
                {isSpinning 
                  ? "En cours..." 
                  : availableActions.length === 0 
                    ? "Partie terminée" 
                    : "Tourner !"}
              </Button>

              <div>
                <Button
                  onClick={handleStopGame}
                  variant="destructive"
                  className="text-lg py-4 px-8"
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