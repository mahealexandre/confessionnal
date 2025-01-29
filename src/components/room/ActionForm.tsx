import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { ActionFormContent } from "./action-form/ActionFormContent";
import { SubmissionStatus } from "./action-form/SubmissionStatus";
import { ActionFormValues } from "./action-form/types";

interface ActionFormProps {
  submittedCount: number;
  totalPlayers: number;
  onAllSubmitted?: () => void;
}

export const ActionForm = ({ submittedCount, totalPlayers, onAllSubmitted }: ActionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = async (values: ActionFormValues) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const roomCode = window.location.pathname.split('/').pop();
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", roomCode)
        .single();

      if (roomError) throw new Error("Could not find room");

      const roomId = roomData.id;
      const playerId = localStorage.getItem(`player_id_${roomId}`);

      if (!playerId) throw new Error("Missing player ID");

      const { data: existingActions } = await supabase
        .from("player_actions")
        .select("id")
        .eq("player_id", playerId)
        .eq("room_id", roomId);

      if (existingActions && existingActions.length > 0) return;

      const actionsToInsert = values.actions.map(action => ({
        player_id: playerId,
        room_id: roomId,
        action_text: action,
      }));

      const { error: insertError } = await supabase
        .from("player_actions")
        .insert(actionsToInsert);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("players")
        .update({ has_submitted: true })
        .eq("id", playerId);

      if (updateError) throw updateError;

      setHasSubmitted(true);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startGame = async () => {
    try {
      const roomCode = window.location.pathname.split('/').pop();
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", roomCode)
        .single();

      if (roomError) throw roomError;

      const { error: updateError } = await supabase
        .from("rooms")
        .update({ status: "playing" })
        .eq("id", roomData.id);

      if (updateError) throw updateError;

      if (onAllSubmitted) {
        onAllSubmitted();
      }
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  const allPlayersSubmitted = submittedCount >= totalPlayers;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4 flex items-center">
      <div className={`max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl ${isMobile ? 'w-full' : ''}`}>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#ff3aa7]">
            Saisissez vos actions 📝
          </h1>
          <p className="text-gray-600">
            {submittedCount} / {totalPlayers} joueurs ont soumis leurs actions
          </p>
        </div>

        {!hasSubmitted ? (
          <ActionFormContent
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        ) : (
          <SubmissionStatus
            submittedCount={submittedCount}
            totalPlayers={totalPlayers}
            onStartGame={startGame}
            allPlayersSubmitted={allPlayersSubmitted}
          />
        )}
      </div>
    </div>
  );
};
