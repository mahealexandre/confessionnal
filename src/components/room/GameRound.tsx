import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Player } from "@/types/game";
import { GameAction, GameState } from "@/types/game-state";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SpinningWheelSection } from "./SpinningWheelSection";
import { ActionDialog } from "./ActionDialog";
import { PlayerSlotMachine } from "./PlayerSlotMachine";
import { GameStateManager } from "./GameStateManager";

interface GameRoundProps {
  players: Player[];
  actions: GameAction[];
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

      const timestamp = new Date().getTime();
      const randomIndex = Math.floor((timestamp % 1000) / 1000 * availableActions.length);
      const selectedAction = availableActions[randomIndex];
      const selectedPlayer = players.find(p => p.id === selectedAction.player_id);

      if (!selectedPlayer) {
        console.error('Player not found for action:', selectedAction);
        return;
      }

      setSelectedPlayer(selectedPlayer);

      setTimeout(() => {
        supabase
          .from('game_state')
          .upsert({
            room_id: selectedPlayer.room_id,
            current_player_id: selectedPlayer.id,
            current_action_id: selectedAction.id,
            dialog_open: true,
            ready_count: 0
          })
          .then(({ error }) => {
            if (error) {
              console.error('Error updating game state:', error);
            }
            isDrawingRef.current = false;
          });
      }, 2000);
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

  const handleGameStateChange = (newState: GameState) => {
    if (newState.ready_count > 0 && !selectedPlayer) {
      setIsSpinning(true);
    }
    
    const player = players.find(p => p.id === newState.current_player_id);
    const action = actions.find(a => a.id === newState.current_action_id);
    
    if (player && action) {
      setSelectedAction(action.action_text);
      setShowDialog(newState.dialog_open);
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
      setSelectedPlayer(null);
      setIsSpinning(false);
      onNextRound();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <SpinningWheelSection
          players={players}
          isSpinning={isSpinning}
          selectedPlayer={selectedPlayer}
          showDialog={showDialog}
          onSpinComplete={() => {
            setIsSpinning(false);
          }}
        />

        <PlayerSlotMachine
          players={players}
          isSpinning={isSpinning}
          finalPlayer={selectedPlayer}
          onSpinComplete={() => setIsSpinning(false)}
        />

        <ActionDialog
          showDialog={showDialog}
          selectedPlayer={selectedPlayer}
          selectedAction={selectedAction}
          onOpenChange={setShowDialog}
          onDoneClick={handleDoneClick}
        />

        <GameStateManager
          players={players}
          onGameStateChange={handleGameStateChange}
        />
      </div>
    </div>
  );
};
