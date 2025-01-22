import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const actionSchema = z.object({
  actions: z.array(z.string().min(1, "Action is required")).length(5),
});

type ActionFormValues = z.infer<typeof actionSchema>;

interface ActionFormProps {
  submittedCount: number;
  totalPlayers: number;
}

export const ActionForm = ({ submittedCount, totalPlayers }: ActionFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      actions: ["", "", "", "", ""],
    },
  });

  const handleSubmit = async (values: ActionFormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log("Starting action submission with values:", values);
      
      const roomCode = window.location.pathname.split('/').pop();
      console.log("Room code:", roomCode);

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
      console.log("Room UUID:", roomId);

      const playerId = localStorage.getItem(`player_id_${roomId}`);
      console.log("Player ID:", playerId);

      if (!playerId) {
        console.error("Missing player ID");
        throw new Error("Missing player ID");
      }

      // Check if player has already submitted actions
      const { data: existingActions } = await supabase
        .from("player_actions")
        .select("id")
        .eq("player_id", playerId)
        .eq("room_id", roomId);

      if (existingActions && existingActions.length > 0) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Vous avez déjà soumis vos actions.",
        });
        return;
      }

      const actionsToInsert = values.actions.map(action => ({
        player_id: playerId,
        room_id: roomId,
        action_text: action
      }));

      console.log("Inserting actions:", actionsToInsert);

      const { error: insertError } = await supabase
        .from("player_actions")
        .insert(actionsToInsert);

      if (insertError) {
        console.error("Error inserting actions:", insertError);
        throw insertError;
      }

      console.log("Actions inserted successfully");

      // Update player's has_submitted status
      const { error: updateError } = await supabase
        .from("players")
        .update({ has_submitted: true })
        .eq("id", playerId);

      if (updateError) {
        console.error("Error updating player status:", updateError);
        throw updateError;
      }

      console.log("Player status updated successfully");
      setHasSubmitted(true);

      toast({
        title: "Actions soumises !",
        description: "Vos actions ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission des actions.",
      });
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

      toast({
        title: "La partie commence !",
        description: "Tous les joueurs ont soumis leurs actions.",
      });
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de démarrer la partie.",
      });
    }
  };

  const allPlayersSubmitted = submittedCount >= totalPlayers;

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className="max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            Saisissez vos actions
          </h1>
          <p className="text-gray-600">
            {submittedCount} / {totalPlayers} joueurs ont soumis leurs actions
          </p>
        </div>

        {!hasSubmitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {form.watch("actions").map((_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`actions.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={`Action ${index + 1}`} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="submit"
                className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-white"
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
              className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-white"
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