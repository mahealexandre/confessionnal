import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { GameRulesDialog } from "@/components/GameRulesDialog";

const Index = () => {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleCreateRoom = async () => {
    if (!username) {
      console.error("Username is required");
      return;
    }

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert([{ code }])
        .select()
        .single();

      if (roomError) throw roomError;

      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert([{ 
          room_id: room.id,
          username,
          is_host: true
        }])
        .select()
        .single();

      if (playerError) throw playerError;

      localStorage.setItem('username', username);
      localStorage.setItem(`player_id_${room.id}`, player.id);
      console.log("Created player with ID:", player.id);

      navigate(`/room/${room.code}`);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleJoinRoom = async () => {
    if (!username || !roomCode) {
      console.error("Username and room code are required");
      return;
    }

    try {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select()
        .eq("code", roomCode.toUpperCase())
        .single();

      if (roomError) throw roomError;

      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert([{ 
          room_id: room.id,
          username
        }])
        .select()
        .single();

      if (playerError) throw playerError;

      localStorage.setItem('username', username);
      localStorage.setItem(`player_id_${room.id}`, player.id);
      console.log("Created player with ID:", player.id);

      navigate(`/room/${room.code}`);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div 
        className={`w-full max-w-md space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl ${
          isMobile ? 'fixed top-4 left-1/2 -translate-x-1/2 max-h-[calc(100vh-2rem)] overflow-y-auto' : ''
        }`}
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            TOURNIQUÉ
          </h1>
          <p className="text-gray-600">
            Créez une salle ou rejoignez-en une existante
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Pseudo</Label>
            <Input
              id="username"
              placeholder="Entrez votre pseudo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {isJoining && (
            <div className="space-y-2">
              <Label htmlFor="roomCode">Code de la salle</Label>
              <Input
                id="roomCode"
                placeholder="Entrez le code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-4 pt-4">
            {!isJoining ? (
              <>
                <Button
                  className="w-full bg-[#F97316] hover:bg-[#EA580C] transition-colors"
                  onClick={handleCreateRoom}
                >
                  Créer une salle
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setIsJoining(true)}
                >
                  Rejoindre une salle
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="w-full bg-[#F97316] hover:bg-[#EA580C] transition-colors"
                  onClick={handleJoinRoom}
                >
                  Rejoindre
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setIsJoining(false)}
                >
                  Retour
                </Button>
              </>
            )}
            
            <GameRulesDialog />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;