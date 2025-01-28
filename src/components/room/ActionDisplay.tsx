import { PlayerAction } from "@/types/game";

interface ActionDisplayProps {
  currentAction: PlayerAction | null;
}

export const ActionDisplay = ({ currentAction }: ActionDisplayProps) => {
  if (!currentAction) return null;

  return (
    <div className="mt-4 p-4 bg-white rounded-xl border-2 border-[#F97316]">
      <p className="text-xl text-[#000000]">{currentAction.action_text}</p>
    </div>
  );
};
