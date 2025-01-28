import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const actionPrompts = [
  "Cite 3 choses que (écrire la suite)",
  "Avoue (écrire la suite)",
  "Dis-nous (écrire la suite)",
  "Que penses-tu de (écrire la suite)",
  "Préfères-tu (écrire la suite)",
];

const actionSchema = z.object({
  actions: z.array(z.string().min(1, "Action is required")).length(5),
});

type ActionFormValues = z.infer<typeof actionSchema>;

interface ActionFormProps {
  submittedCount: number;
  totalPlayers: number;
  onAllSubmitted?: () => void;
}

export const ActionForm = ({ submittedCount, totalPlayers, onAllSubmitted }: ActionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isMobile = useIsMobile();

  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      actions: actionPrompts, // Pré-remplit les champs avec les phrases
    },
  });

  const handleSubmit = async (values: ActionFormValues) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log("Starting action submission with values:", values);

      const roomCode = window.location.pathname.split('/').pop();
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", roomCode)
        .single();

      if (roomError) {
        console.error("Error fetching room:", roomError);
        throw new Error("Could not find room");
      }

      const roomId = roomData.id;
      const playerId = localStorage.getItem(`player_id_${roomId}`);

      if (!playerId) {
        console.error("Missing player ID");
        throw new Error("Missing player ID");
      }

      const { data: existingActions } = await supabase
        .from("player_actions")
        .select("id")
        .eq("player_id", playerId)
        .eq("room_id", roomId);

      if (existingActions && existingActions.length > 0) {
        return;
      }

      const actionsToInsert = values.actions.map(action => ({
        player_id: playerId,
        room_id: roomId,
        action_text: action,
      }));

      const { error: insertError } = await supabase
        .from("player_actions")
        .insert(actionsToInsert);

      if (insertError) {
        console.error("Error inserting actions:", insertError);
        throw insertError;
      }

      const { error: updateError } = await supabase
        .from("players")
        .update({ has_submitted: true })
        .eq("id", playerId);

      if (updateError) {
        console.error("Error updating player status:", updateError);
        throw updateError;
      }

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
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className={`max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl ${isMobile ? 'sticky top-4' : ''}`}>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-[#2E1F47]">
            Saisissez vos actions
          </h1>
          <p className="text-gray-600">
            {submittedCount} / {totalPlayers} joueurs ont soumis leurs actions
          </p>
        </div>

        {!hasSubmitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {form.watch("actions").map((value, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`actions.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value} // Utilise la valeur actuelle
                          onChange={(e) => field.onChange(e.target.value)} // Met à jour la valeur
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="submit"
                className="w-full bg-[#2E1F47] hover:bg-[#000000]/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi en cours..." : "Suivant"}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Vos actions ont été enregistrées. En attente des autres joueurs...
            </p>
            <Button
              onClick={startGame}
              className="w-full bg-[#2E1F47] hover:bg-[#000000]/90 text-white"
              disabled={!allPlayersSubmitted}
            >
              {allPlayersSubmitted ? "Commencer" : "En attente des autres joueurs..."}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
