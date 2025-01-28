import { Player } from "@/types/game";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerDisplayProps {
  selectedPlayer: Player | null;
  countdown: number | null;
}

export const PlayerDisplay = ({ selectedPlayer, countdown }: PlayerDisplayProps) => (
  <div className="relative h-32 border-4 border-[#F97316] rounded-xl overflow-hidden bg-white">
    <AnimatePresence mode="wait">
      {countdown !== null ? (
        <motion.div
          key="countdown"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-4xl font-bold text-[#F97316]">
            {countdown}
          </span>
        </motion.div>
      ) : selectedPlayer ? (
        <motion.div
          key={selectedPlayer.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-2xl font-bold text-[#F97316]">
            {selectedPlayer.username}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  </div>
);