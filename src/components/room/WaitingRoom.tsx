import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Player } from "@/types/game";
import { useIsMobile } from "@/hooks/use-mobile";

interface WaitingRoomProps {
  code: string;
  players: Player[];
  onStartGame: () => void;
}

export const WaitingRoom = ({ code, players, onStartGame }: WaitingRoomProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#FFFAE5] to-[#FFD1DC] p-4">
      <div
        className={`max-w-2xl mx-auto space-y-8 bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl ${
          isMobile ? "sticky top-4" : ""
        }`}
      >
        {/* Title and Room Code */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Salle d'attente
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-700 font-medium">Code de la salle :</p>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(code || "");
                toast({
                  description: "Code copié !",
                });
              }}
            >
              {code}
            </Button>
          </div>
        </div>

        {/* Player List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-[#4A4E74]">Joueurs</h2>
          <div className="grid gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
              >
                <span className="font-medium text-gray-800">
                  {player.username}
                </span>
                {player.is_host && (
                  <span className="text-sm text-[#34D399]">Hôte</span> {/* Vert pour "Hôte" */}
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <div className="flex justify-center">
          <Button
            onClick={onStartGame}
            className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white transition-colors py-3 rounded-lg font-semibold"
          >
            Lancer la partie
          </Button>
        </div>
      </div>
    </div>
  );
};
