import { Button } from "@/components/ui/button";
import { SpinningWheel } from "./SpinningWheel";
import { Player } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SpinningWheelSectionProps {
  players: Player[];
  isSpinning: boolean;
  selectedPlayer: Player | null;
  showDialog: boolean;
  onSpinComplete: () => void;
}

export const SpinningWheelSection = ({
  players,
  isSpinning,
  selectedPlayer,
  showDialog,
  onSpinComplete,
}: SpinningWheelSectionProps) => {
  const handleChooseClick = async () => {
    if (players.length === 0 || isSpinning || showDialog) return;
    
    const roomId = players[0].room_id;
    
    try {
      const { error: updateError } = await supabase
        .from('game_state')
        .update({ 
          ready_count: 1,
          current_player_id: null,
          current_action_id: null,
          dialog_open: false
        })
        .eq('room_id', roomId);

      if (updateError) {
        console.error('Error updating ready count:', updateError);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour le compteur.",
        });
      }
    } catch (error) {
      console.error('Error in handleChooseClick:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue.",
      });
    }
  };

  return (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
        {selectedPlayer?.username || "..."}
      </h1>
      <SpinningWheel
        players={players}
        isSpinning={isSpinning}
        selectedPlayer={selectedPlayer}
        onSpinComplete={onSpinComplete}
      />
      <div className="mt-4">
        <Button 
          onClick={handleChooseClick}
          disabled={isSpinning || showDialog}
          className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
        >
          Choisir
        </Button>
      </div>
    </div>
  );
};