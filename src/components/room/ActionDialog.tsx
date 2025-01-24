import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { motion } from "framer-motion";

interface ActionDialogProps {
  showDialog: boolean;
  selectedPlayer: Player | null;
  selectedAction: string;
  onOpenChange: (open: boolean) => void;
  onDoneClick: () => void;
}

export const ActionDialog = ({
  showDialog,
  selectedPlayer,
  selectedAction,
  onOpenChange,
  onDoneClick,
}: ActionDialogProps) => {
  return (
    <Dialog open={showDialog} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 border-none shadow-xl sm:max-w-[425px] rounded-xl">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-300 dark:to-pink-300">
            Action pour {selectedPlayer?.username}
          </DialogTitle>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DialogDescription className="text-lg text-center font-medium text-gray-700 dark:text-gray-300 p-4 bg-white/50 dark:bg-black/20 rounded-lg shadow-inner">
              {selectedAction}
            </DialogDescription>
          </motion.div>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onDoneClick}
              className="w-full sm:w-auto px-8 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl"
            >
              C'est fait ! 🎉
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};