import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const actionSchema = z.object({
  actions: z.array(z.string().min(1, "Action is required")).length(5),
});

type ActionFormValues = z.infer<typeof actionSchema>;

interface ActionFormProps {
  onSubmit: (values: ActionFormValues) => void;
  submittedCount: number;
  totalPlayers: number;
}

export const ActionForm = ({ onSubmit, submittedCount, totalPlayers }: ActionFormProps) => {
  const { toast } = useToast();
  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      actions: ["", "", "", "", ""],
    },
  });

  const handleSubmit = async (values: ActionFormValues) => {
    try {
      // Log the values being submitted
      console.log("Submitting actions:", values);
      
      // Call the parent component's onSubmit
      await onSubmit(values);

      toast({
        title: "Actions soumises !",
        description: "Vos actions ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Error submitting actions:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission des actions.",
      });
    }
  };

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
            >
              Suivant
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};