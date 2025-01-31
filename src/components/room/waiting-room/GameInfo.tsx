interface GameInfoProps {
  jokerInfo: string;
  healthWarning: string;
}

export const GameInfo = ({ jokerInfo, healthWarning }: GameInfoProps) => {
  return (
    <div className="mt-4">
      <p className="text-sm text-center text-gray-600">{jokerInfo}</p>
      {healthWarning && (
        <p className="text-sm text-center text-red-600 italic">{healthWarning}</p>
      )}
    </div>
  );
};