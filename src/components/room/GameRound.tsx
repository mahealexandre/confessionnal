import { useEffect, useState, useRef } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GameRoundProps {
  players: Player[];
  actions: { id: string; action_text: string; player_id: string }[];
  onNextRound: () => void;
}

export const GameRound = ({ players, actions, onNextRound }: GameRoundProps) => {
  const [isSpinning, setIsSpinning] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [usedActionIds, setUsedActionIds] = useState<string[]>([]);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const spinDuration = 3000;
    const spinInterval = 100;
    let currentIndex = 0;
    let spinTimer: NodeJS.Timeout;

    const spin = () => {
      if (isSpinning) {
        currentIndex = (currentIndex + 1) % players.length;
        setSelectedPlayer(players[currentIndex]);
        spinTimer = setTimeout(spin, spinInterval);
      }
    };

    // Prevent multiple draws from happening simultaneously
    if (!isDrawingRef.current && isSpinning) {
      isDrawingRef.current = true;
      spin();

      // When the spinning stops, select a random player and unused action
      setTimeout(async () => {
        setIsSpinning(false);
        clearTimeout(spinTimer);
        
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        const availableActions = actions.filter(
          (action) => 
            action.player_id === randomPlayer.id && 
            !usedActionIds.includes(action.id)
        );

        if (!randomPlayer || availableActions.length === 0) {
          toast({
            title: "Partie terminée !",
            description: "Toutes les actions ont été réalisées.",
          });
          return;
        }

        const randomAction = availableActions[
          Math.floor(Math.random() * availableActions.length)
        ];

        // Update the game state in Supabase
        const { error } = await supabase
          .from('game_state')
          .upsert({
            room_id: randomPlayer.room_id,
            current_player_id: randomPlayer.id,
            current_action_id: randomAction.id
          });

        if (error) {
          console.error('Error updating game state:', error);
        }

        isDrawingRef.current = false;
      }, spinDuration);
    }

    return () => clearTimeout(spinTimer);
  }, [players, actions, isSpinning, usedActionIds]);

  // Subscribe to game state changes
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
        async (payload) => {
          console.log('Game state changed:', payload);
          const newState = payload.new as any;
          
          // Find the selected player and action from the new state
          const player = players.find(p => p.id === newState.current_player_id);
          const action = actions.find(a => a.id === newState.current_action_id);
          
          if (player && action) {
            setSelectedPlayer(player);
            setSelectedAction(action.action_text);
            setShowDialog(true);
          } else {
            setShowDialog(false);
            setIsSpinning(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [players, actions]);

  const handleDoneClick = async () => {
    if (selectedPlayer && selectedAction) {
      // Mark the current action as used
      const currentAction = actions.find(a => a.action_text === selectedAction);
      if (currentAction) {
        setUsedActionIds(prev => [...prev, currentAction.id]);
      }

      // Reset game state in Supabase
      const { error } = await supabase
        .from('game_state')
        .update({
          current_player_id: null,
          current_action_id: null
        })
        .eq('room_id', selectedPlayer.room_id);

      if (error) {
        console.error('Error resetting game state:', error);
      }

      // Check if all actions have been used
      const remainingActions = actions.filter(action => !usedActionIds.includes(action.id));
      if (remainingActions.length === 0) {
        toast({
          title: "Partie terminée !",
          description: "Toutes les actions ont été réalisées.",
        });
      }
    }
    
    setShowDialog(false);
    onNextRound();
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className="max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            {selectedPlayer?.username || "..."}
          </h1>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Action pour {selectedPlayer?.username}</DialogTitle>
              <DialogDescription>{selectedAction}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleDoneClick}>Fait !</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};