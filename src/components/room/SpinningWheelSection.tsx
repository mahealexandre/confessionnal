import { Player } from "@/types/game";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  onSpinComplete,
}: SpinningWheelSectionProps) => {
  const handleChooseClick = async () => {
    const roomId = players[0]?.room_id;
    if (!roomId) return;

    // Get all game states for this room
    const { data: gameStates } = await supabase
      .from("game_state")
      .select("ready_count")
      .eq("room_id", roomId);

    // Calculate the new ready count as the maximum ready_count + 1
    const currentMaxReadyCount = gameStates?.reduce((max, state) => 
      Math.max(max, state.ready_count || 0), 0) || 0;
    const newReadyCount = currentMaxReadyCount + 1;

    // Update all game state records for this room
    await supabase
      .from("game_state")
      .update({ ready_count: newReadyCount })
      .eq("room_id", roomId);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Button
          onClick={handleChooseClick}
          className="bg-[#F97316] hover:bg-[#EA580C] transition-colors"
          disabled={isSpinning}
        >
          Choisir
        </Button>
      </div>
    </div>
  );
};