import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { SpinningWheel } from "./SpinningWheel";

interface GameRoundProps {
  players: Player[];
  actions: { id: string; action_text: string; player_id: string }[];
  onNextRound: () => void;
}

export const GameRound = ({ players, actions, onNextRound }: GameRoundProps) => {
  const navigate = useNavigate();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [usedActionIds, setUsedActionIds] = useState<string[]>([]);
  const [readyCount, setReadyCount] = useState(0);
  const isDrawingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const hasClickedRef = useRef(false);

  const cleanupGame = async () => {
    if (players.length > 0) {
      const roomId = players[0].room_id;
      
      await Promise.all([
        supabase.from('game_state').delete().eq('room_id', roomId),
        supabase.from('player_actions').delete().eq('room_id', roomId),
        supabase.from('players').delete().eq('room_id', roomId),
        supabase.from('rooms').delete().eq('room_id', roomId)
      ]);

      navigate('/');
    }
  };

  useEffect(() => {
    if (!isDrawingRef.current && isSpinning) {
      isDrawingRef.current = true;

      const availableActions = actions.filter(action => !usedActionIds.includes(action.id));
      
      if (availableActions.length === 0) {
        toast({
          title: "Partie terminée !",
          description: "Toutes les actions ont été réalisées.",
        });
        cleanupGame();
        return;
      }

      const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
      const randomPlayer = players.find(p => p.id === randomAction.player_id);

      if (!randomPlayer) {
        console.error('Player not found for action:', randomAction);
        return;
      }

      supabase
        .from('game_state')
        .upsert({
          room_id: randomPlayer.room_id,
          current_player_id: randomPlayer.id,
          current_action_id: randomAction.id,
          dialog_open: false,
          ready_count: 0
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error updating game state:', error);
          }
          isDrawingRef.current = false;
        });
    }
  }, [players, actions, isSpinning, usedActionIds, navigate]);

  useEffect(() => {
    const initializeGameState = async () => {
      if (players.length === 0 || hasInitializedRef.current) return;
      
      const roomId = players[0].room_id;
      const { data: existingState } = await supabase
        .from('game_state')
        .select('*')
        .eq('room_id', roomId)
        .maybeSingle();

      if (!existingState) {
        await supabase
          .from('game_state')
          .insert({
            room_id: roomId,
            ready_count: 0,
            dialog_open: false
          });
      }
      
      hasInitializedRef.current = true;
    };

    initializeGameState();
  }, [players]);

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
          
          if (newState.ready_count === players.length && !isSpinning && !showDialog) {
            setIsSpinning(true);
            hasClickedRef.current = false;
          }
          
          const player = players.find(p => p.id === newState.current_player_id);
          const action = actions.find(a => a.id === newState.current_action_id);
          
          if (player && action) {
            setSelectedPlayer(player);
            setSelectedAction(action.action_text);
            if (newState.dialog_open) {
              setShowDialog(true);
              setIsSpinning(false); // Stop spinning when dialog opens
            }
          }

          setReadyCount(newState.ready_count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [players, actions, isSpinning, showDialog]);

  const handleChooseClick = async () => {
    if (players.length === 0 || hasClickedRef.current) return;
    
    const roomId = players[0].room_id;
    
    try {
      const { data: currentState } = await supabase
        .from('game_state')
        .select('ready_count')
        .eq('room_id', roomId)
        .maybeSingle();

      const currentCount = currentState?.ready_count || 0;
      const newCount = currentCount + 1;

      const { error: updateError } = await supabase
        .from('game_state')
        .update({ ready_count: newCount })
        .eq('room_id', roomId);

      if (updateError) {
        console.error('Error updating ready count:', updateError);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de mettre à jour le compteur.",
        });
      } else {
        hasClickedRef.current = true;
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

  const handleDoneClick = async () => {
    if (selectedPlayer && selectedAction) {
      const currentAction = actions.find(a => a.action_text === selectedAction);
      if (currentAction) {
        setUsedActionIds(prev => [...prev, currentAction.id]);
      }

      const { error: dialogError } = await supabase
        .from('game_state')
        .update({
          dialog_open: false,
          ready_count: 0,
          current_player_id: null,
          current_action_id: null
        })
        .eq('room_id', selectedPlayer.room_id);

      if (dialogError) {
        console.error('Error updating dialog state:', dialogError);
        return;
      }

      setShowDialog(false);
      setIsSpinning(false);
      hasClickedRef.current = false;
      onNextRound();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className="max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            {selectedPlayer?.username || "..."}
          </h1>
          <SpinningWheel
            players={players}
            isSpinning={isSpinning}
            selectedPlayer={selectedPlayer}
            onSpinComplete={() => {
              setIsSpinning(false);
              if (selectedPlayer) {
                supabase
                  .from('game_state')
                  .update({
                    dialog_open: true
                  })
                  .eq('room_id', selectedPlayer.room_id)
                  .then(({ error }) => {
                    if (error) console.error('Error updating dialog state:', error);
                  });
              }
            }}
          />
          <div className="mt-4">
            <Button 
              onClick={handleChooseClick}
              disabled={isSpinning || hasClickedRef.current || showDialog}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
            >
              Choisir ({readyCount}/{players.length})
            </Button>
          </div>
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