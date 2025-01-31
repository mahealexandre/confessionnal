import { Player } from "@/types/game";

interface PlayersListProps {
  players: Player[];
}

export const PlayersList = ({ players }: PlayersListProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Joueurs 👥​</h2>
      <div className="grid gap-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
          >
            <span className="font-medium">{player.username}</span>
            {player.is_host && (
              <span className="text-sm text-[#2E1F47]">Hôte</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};