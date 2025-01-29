import { z } from "zod";

export const actionSchema = z.object({
  actions: z.array(z.string().min(1, "Action is required")).length(5),
});

export type ActionFormValues = z.infer<typeof actionSchema>;