import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const GameRulesDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Règles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[80vh] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Règles du jeu</DialogTitle>
          <DialogDescription>
            Voici comment jouer à Confessionnal
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Création de la partie</h3>
              <p>
                Un joueur crée une salle et partage le code avec les autres
                participants. Les autres joueurs peuvent rejoindre la salle avec ce
                code.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Choix du mode de difficulté</h3>
              <p>
                Avant de commencer, le créateur de la salle choisit le mode de difficulté de la partie.
                Ce choix détermine le nombre de jokers et leur coût. Voici les options disponibles :
              </p>
              <ul>
                <li><strong>Sans alcool 🙂</strong> : Un joker disponible pour chaque joueur.</li>
                <li><strong>Léger 😳</strong> : Trois jokers disponibles, mais chaque joker coûte 3 gorgées.</li>
                <li><strong>Non recommandé 😵‍💫</strong> : Trois jokers disponibles, mais chaque joker coûte 1 cul-sec.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Saisie des actions</h3>
              <p>
                Chaque joueur doit écrire 5 défis/questions différentes (ex: Cite 2 personnes que tu méprises).
                Une fois que tous les joueurs ont soumis leurs défis, la partie peut commencer.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Déroulement du jeu</h3>
              <p>
                Les joueurs doivent cliquer sur le bouton "Lancer" pour
                faire "tourner la roue". Un joueur est choisi au hasard et
                un défi est révélé. Le joueur sélectionné doit alors réaliser
                le défi indiqué / se confesser.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Actions uniques</h3>
              <p>
                Chaque défi ne peut être réalisé qu'une seule fois. Une fois
                qu'un défi a été effectué, il est marqué comme utilisé et
                ne réapparaîtra plus dans le jeu.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6. Les Jokers</h3>
              <p>
                Selon le mode de difficulté choisi, les jokers fonctionnent comme suit :
              </p>
              <ul>
                <li><strong>Sans alcool 🙂</strong> : Chaque joueur commence avec 1 joker. Un joker permet de contourner un défi.</li>
                <li><strong>Léger 😳</strong> : Chaque joueur commence avec 3 jokers, mais chaque joker coûte 3 gorgées.</li>
                <li><strong>Non recommandé 😵‍💫</strong> : Chaque joueur commence avec 3 jokers, mais chaque joker coûte 1 cul-sec.</li>
              </ul>
              <p>
                Les jokers sont limités, alors il faudra les utiliser judicieusement. Le nombre de
                jokers restant est affiché à côté du nom du joueur. Si un joueur n'a plus de jokers,
                il devra réaliser tous les défis qui lui seront attribués.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">7. Fin de la partie</h3>
              <p>
                La partie se termine lorsque tous les défis ont été réalisés.
                Les joueurs peuvent également décider d'arrêter la partie à tout
                moment en cliquant sur le bouton "Arrêter la partie".
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Une application by <a href="https://mahealexandre.com" target="_blank" rel="noopener noreferrer" className="text-[#ff3aa7]">Alexandre Mahé</a></p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
