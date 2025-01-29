import { PlayerAction } from "@/types/game";

interface ActionDisplayProps {
  currentAction: PlayerAction | null;
}

export const ActionDisplay = ({ currentAction }: ActionDisplayProps) => {
  return (
    <div className="mt-4 p-4 bg-white rounded-xl border-2 border-[#9C2FB0] w-full h-20 flex items-center justify-center overflow-hidden">
      <p className="text-xl text-[#000000] text-ellipsis overflow-hidden text-center break-words">
        {currentAction ? currentAction.action_text : "Aucune action en cours"}
      </p>
    </div>
  );
};
