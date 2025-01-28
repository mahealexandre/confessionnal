import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSpinAnimation = (roomId: string) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const startSpinAnimation = async () => {
    try {
      const { error: animationError } = await supabase
        .from("game_state")
        .update({ animation_state: 'spinning' })
        .eq("room_id", roomId);

      if (animationError) throw animationError;
      return true;
    } catch (error) {
      console.error("Error starting spin animation:", error);
      return false;
    }
  };

  return {
    isSpinning,
    setIsSpinning,
    countdown,
    setCountdown,
    startSpinAnimation
  };
};