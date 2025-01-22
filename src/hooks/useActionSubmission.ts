import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useActionSubmission = (currentPlayerId: string | null, roomId: string | null) => {
  const { toast } = useToast();

  const submitActions = async (values: { actions: string[] }) => {
    if (!currentPlayerId || !roomId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID du joueur ou de la salle manquant. Veuillez rafraîchir la page.",
      });
      return;
    }

    try {
      // Insert all actions and collect any errors
      const results = await Promise.all(
        values.actions.map((action) =>
          supabase
            .from("player_actions")
            .insert({
              player_id: currentPlayerId,
              action_text: action,
              room_id: roomId,
            })
            .select()
        )
      );

      // Check if any insertion failed
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        console.error("Errors inserting actions:", errors);
        throw new Error("Une ou plusieurs actions n'ont pas pu être enregistrées");
      }

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