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
  selectedPlayer,
  onSpinComplete,
}: SpinningWheelSectionProps) => {
  const handleChooseClick = async () => {
    const roomId = players[0]?.room_id;
    if (!roomId) return;

    const { data: gameState } = await supabase
      .from("game_state")
      .select("ready_count")
      .eq("room_id", roomId)
      .single();

    const newReadyCount = (gameState?.ready_count || 0) + 1;

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
        >
          Choisir
        </Button>
        {selectedPlayer && (
          <div className="text-2xl font-bold text-center mt-8 p-4 bg-white/50 rounded-lg shadow">
            {selectedPlayer.username}
          </div>
        )}
      </div>
    </div>
  );
};