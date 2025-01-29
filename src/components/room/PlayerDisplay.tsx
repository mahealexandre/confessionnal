import { Player } from "@/types/game";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerDisplayProps {
  selectedPlayer: Player | null;
  countdown: number | null;
  players?: Player[];
}

export const PlayerDisplay = ({ selectedPlayer, countdown, players = [] }: PlayerDisplayProps) => {
  // If we're in countdown mode and have players, show a random player name
  const getRandomPlayerName = () => {
    if (!players.length) return "";
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex].username;
  };

  return (
    <div className="relative h-32 border-4 border-[#9C2FB0] rounded-xl overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        {countdown !== null ? (
          <motion.div
            key={countdown}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-2xl font-bold text-[#9C2FB0]">
              {getRandomPlayerName()}
            </span>
          </motion.div>
        ) : selectedPlayer ? (
          <motion.div
            key={selectedPlayer.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-2xl font-bold text-[#000000]">
              {selectedPlayer.username}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};