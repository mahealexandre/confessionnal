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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Action pour {selectedPlayer?.username}</DialogTitle>
          <DialogDescription>{selectedAction}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onDoneClick}>Fait !</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};