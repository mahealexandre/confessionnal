import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface DifficultySelectorProps {
  difficulty: string;
  onDifficultyChange: (value: string) => void;
}

export const DifficultySelector = ({ difficulty, onDifficultyChange }: DifficultySelectorProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Difficulté 🎯</h2>
      <ToggleGroup
        type="single"
        value={difficulty}
        onValueChange={onDifficultyChange}
        className="justify-center"
      >
        <ToggleGroupItem value="sober" aria-label="Sans alcool" className="text-3xl">
          🙂
        </ToggleGroupItem>
        <ToggleGroupItem value="easy" aria-label="Easy" className="text-3xl">
          😳
        </ToggleGroupItem>
        <ToggleGroupItem value="hard" aria-label="Hard" className="text-3xl">
          😵‍💫
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};