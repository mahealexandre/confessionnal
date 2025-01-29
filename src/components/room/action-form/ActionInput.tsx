import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ActionFormValues } from "./types";

interface ActionInputProps {
  index: number;
  form: UseFormReturn<ActionFormValues>;
}

export const ActionInput = ({ index, form }: ActionInputProps) => {
  return (
    <FormField
      key={index}
      control={form.control}
      name={`actions.${index}`}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input
              {...field}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};