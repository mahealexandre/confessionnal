import { PlayerAction } from "@/types/game";

interface ActionDisplayProps {
  currentAction: PlayerAction | null;
}

export const ActionDisplay = ({ currentAction }: ActionDisplayProps) => {
  if (!currentAction) return null;

  return (
    <div className="mt-4 p-4 bg-white rounded-xl border-2 border-[#2E1F47]">
      <p className="text-xl text-[#2E1F47]">{currentAction.action_text}</p>
    </div>
  );
};
