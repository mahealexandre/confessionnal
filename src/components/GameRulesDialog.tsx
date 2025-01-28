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
          Règles du jeu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[80vh] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Règles du jeu</DialogTitle>
          <DialogDescription>
            Voici comment jouer à TOURNIQUÉ
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
              <h3 className="font-semibold mb-2">2. Saisie des actions</h3>
              <p>
                Chaque joueur doit écrire 5 actions différentes. Ces actions
                peuvent être drôles, créatives ou challengeantes. Une fois que tous
                les joueurs ont soumis leurs actions, la partie peut commencer.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Déroulement du jeu</h3>
              <p>
                À tour de rôle, les joueurs cliquent sur le bouton "Tourner" pour
                faire tourner la roue. La roue s'arrête sur un joueur au hasard et
                une action est révélée. Le joueur sélectionné doit alors réaliser
                l'action indiquée.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Actions uniques</h3>
              <p>
                Chaque action ne peut être réalisée qu'une seule fois. Une fois
                qu'une action a été effectuée, elle est marquée comme utilisée et
                ne réapparaîtra plus dans le jeu.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Fin de la partie</h3>
              <p>
                La partie se termine lorsque toutes les actions ont été réalisées.
                Les joueurs peuvent également décider d'arrêter la partie à tout
                moment en cliquant sur le bouton "Arrêter la partie".
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Conseils</h3>
              <ul className="list-disc pl-4 space-y-2">
                <li>
                  Soyez créatifs dans vos actions, mais restez respectueux
                </li>
                <li>
                  Évitez les actions dangereuses ou inappropriées
                </li>
                <li>
                  Amusez-vous et profitez du moment avec vos amis !
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
