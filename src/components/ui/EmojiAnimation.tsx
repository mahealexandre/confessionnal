import { useEffect, useState } from "react";

interface EmojiAnimationProps {
  onAnimationEnd: () => void;
}

export const EmojiAnimation = ({ onAnimationEnd }: EmojiAnimationProps) => {
  const [emojis, setEmojis] = useState<number[]>([]);

  useEffect(() => {
    // Générer un tableau d'emojis
    const emojiIndexes = Array.from({ length: 20 }, (_, index) => index);
    setEmojis(emojiIndexes);

    // Fin de l'animation après 4 secondes
    const timeout = setTimeout(() => {
      onAnimationEnd();
    }, 4000);

    return () => clearTimeout(timeout);
  }, [onAnimationEnd]);

  return (
    <div className="emoji-animation-container">
      {emojis.map((index) => (
        <span
          key={index}
          className="emoji"
          style={{
            left: `${Math.random() * 100}%`, // Position horizontale aléatoire
            animationDelay: `${Math.random() * 2}s`, // Délai aléatoire pour variation
          }}
        >
          🃏
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
          overflow: hidden;
        }
        .emoji {
          position: absolute;
          bottom: -100px;
          font-size: 3.5rem; /* Taille des emojis */
          animation: rise 4s ease-in-out forwards;
          opacity: 0.8; /* Légère transparence */
        }
        @keyframes rise {
          0% {
            transform: translateY(0) scale(1); /* Départ */
            opacity: 1;
          }
          50% {
            opacity: 0.9; /* Apparition maximale au milieu */
          }
          100% {
            transform: translateY(-120vh) scale(1.2); /* Fin au-dessus de l'écran */
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
