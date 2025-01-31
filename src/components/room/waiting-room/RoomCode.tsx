import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RoomCodeProps {
  code: string;
}

export const RoomCode = ({ code }: RoomCodeProps) => {
  const { toast } = useToast();

  return (
    <div className="flex items-center justify-center gap-4">
      <p className="text-gray-600">Code de la salle:</p>
      <Button
        variant="outline"
        onClick={() => {
          navigator.clipboard.writeText(code || "");
          toast({
            description: "Code copié !",
            duration: 3000,
          });
        }}
      >
        {code}
      </Button>
    </div>
  );
};