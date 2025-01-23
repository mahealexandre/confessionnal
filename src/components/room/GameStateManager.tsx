import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/game";

interface GameStateManagerProps {
  players: Player[];
  onGameStateChange: (state: any) => void;
}

export const GameStateManager = ({ players, onGameStateChange }: GameStateManagerProps) => {
  useEffect(() => {
    const channel = supabase
      .channel('game_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state'
        },
        (payload) => {
          console.log('Game state changed:', payload);
          onGameStateChange(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [players, onGameStateChange]);

  return null;
};