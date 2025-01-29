import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionInput } from "./ActionInput";
import { actionSchema, ActionFormValues } from "./types";

interface ActionFormContentProps {
  onSubmit: (values: ActionFormValues) => Promise<void>;
  isSubmitting: boolean;
}

const actionPrompts = [
  "Cite 3 choses que (écrire la suite)",
  "Avoue (écrire la suite)",
  "Dis-nous (écrire la suite)",
  "Que penses-tu de (écrire la suite)",
  "Préfères-tu (écrire la suite)",
];

export const ActionFormContent = ({ onSubmit, isSubmitting }: ActionFormContentProps) => {
  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      actions: actionPrompts,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {form.watch("actions").map((_, index) => (
          <ActionInput key={index} index={index} form={form} />
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
  );
};