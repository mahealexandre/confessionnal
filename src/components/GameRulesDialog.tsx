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
                Un joueur créer une salle et partage le code avec les autres
                participants. Les autres joueurs peuvent rejoindre la salle avec ce
                code.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Saisie des actions</h3>
              <p>
                Chaque joueur doit écrire 5 défis/questions différentes (ex: Cite 2 personnes que tu méprises).
                Une fois que tous les joueurs ont soumis leurs défis, la partie peut commencer.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Déroulement du jeu</h3>
              <p>
                Les joueurs doivent cliquer sur le bouton "Lancer" pour
                faire "tourner la roue". Un joueur est choisi au hasard et
                un défi est révélé. Le joueur sélectionné doit alors réaliser
                le défi indiqué / se confesser.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Actions uniques</h3>
              <p>
                Chaque défi ne peut être réalisé qu'une seule fois. Une fois
                qu'un défi a été effectué, il est marqué comme utilisé et
                ne réapparaîtra plus dans le jeu.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Fin de la partie</h3>
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
