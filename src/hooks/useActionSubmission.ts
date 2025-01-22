import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useActionSubmission = (currentPlayerId: string | null, roomCode: string | null) => {
  const { toast } = useToast();

  const submitActions = async (values: { actions: string[] }) => {
    if (!currentPlayerId || !roomCode) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID du joueur ou code de la salle manquant. Veuillez rafraîchir la page.",
      });
      return;
    }

    try {
      // First get the room UUID from the code
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", roomCode)
        .maybeSingle();

      if (roomError) throw roomError;
      if (!room) throw new Error("Salle introuvable");

      // Insert all actions using the room UUID
      const { data: actionsData, error: actionsError } = await supabase
        .from("player_actions")
        .insert(
          values.actions.map((action) => ({
            player_id: currentPlayerId,
            action_text: action,
            room_id: room.id,
          }))
        )
        .select();

      if (actionsError) throw actionsError;

      // Update player status
      const { error: playerError } = await supabase
        .from("players")
        .update({ has_submitted: true })
        .eq("id", currentPlayerId);

      if (playerError) throw playerError;

      toast({
        title: "Actions soumises !",
        description: "Vos actions ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Error submitting actions:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Impossible de soumettre vos actions.",
      });
    }
  };

  return { submitActions };
};