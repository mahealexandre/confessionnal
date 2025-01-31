
import { useEffect, useState } from "react";

interface EmojiAnimationProps {
  onAnimationEnd: () => void;
}

export const EmojiAnimation = ({ onAnimationEnd }: EmojiAnimationProps) => {
  const [emojis, setEmojis] = useState<string[]>([]);

  useEffect(() => {
    // Générer un tableau d'emojis
    const generatedEmojis = Array.from({ length: 20 }, () => "🃏");
    setEmojis(generatedEmojis);

    // Fin de l'animation après 3 secondes
    const timeout = setTimeout(() => {
      onAnimationEnd();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [onAnimationEnd]);

  return (
    <div className="emoji-animation-container">
      {emojis.map((emoji, index) => (
        <span
          key={index}
          className="emoji"
          style={{ left: `${Math.random() * 100}%` }} // Position horizontale aléatoire
        >
          {emoji}
        </span>
      ))}

      <style jsx>{`
        .emoji-animation-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          pointer-events: none;
          z-index: 9999;
        }
        .emoji {
          position: absolute;
          bottom: -50px;
          font-size: 2rem;
          animation: rise 3s ease-in forwards;
          opacity: 0;
        }
        @keyframes rise {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-150vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
