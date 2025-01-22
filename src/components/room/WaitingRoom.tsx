import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Player } from "@/types/game";

interface WaitingRoomProps {
  code: string;
  players: Player[];
  onStartGame: () => void;
}

export const WaitingRoom = ({ code, players, onStartGame }: WaitingRoomProps) => {
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className="max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            Salle d'attente
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-600">Code de la salle:</p>
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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Joueurs</h2>
          <div className="grid gap-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
              >
                <span className="font-medium">{player.username}</span>
                {player.is_host && (
                  <span className="text-sm text-[#F97316]">Hôte</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onStartGame}
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
          >
            Lancer la partie
          </Button>
        </div>
      </div>
    </div>
  );
};