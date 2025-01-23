import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Player } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SpinningWheelSection } from "./SpinningWheelSection";
import { ActionDialog } from "./ActionDialog";

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
  const isDrawingRef = useRef(false);
  const hasInitializedRef = useRef(false);

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
    if (!isDrawingRef.current && isSpinning && !selectedPlayer) {
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
          setIsSpinning(false);
        });
    }
  }, [players, actions, isSpinning, usedActionIds, navigate, selectedPlayer]);

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
          
          if (newState.ready_count > 0 && !selectedPlayer) {
            setIsSpinning(true);
          }
          
          const player = players.find(p => p.id === newState.current_player_id);
          const action = actions.find(a => a.id === newState.current_action_id);
          
          if (player && action) {
            setSelectedPlayer(player);
            setSelectedAction(action.action_text);
            if (newState.dialog_open) {
              setShowDialog(true);
              setIsSpinning(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [players, actions, selectedPlayer]);

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
      setSelectedPlayer(null);
      setIsSpinning(false);
      onNextRound();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className="max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <SpinningWheelSection
          players={players}
          isSpinning={isSpinning}
          selectedPlayer={selectedPlayer}
          showDialog={showDialog}
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

        <ActionDialog
          showDialog={showDialog}
          selectedPlayer={selectedPlayer}
          selectedAction={selectedAction}
          onOpenChange={setShowDialog}
          onDoneClick={handleDoneClick}
        />
      </div>
    </div>
  );
};