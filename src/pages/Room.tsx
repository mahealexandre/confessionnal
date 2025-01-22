import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface Player {
  id: string;
  username: string;
  is_host: boolean;
  has_submitted?: boolean;
}

const actionSchema = z.object({
  actions: z.array(z.string().min(1, "Action is required")).length(5),
});

type ActionFormValues = z.infer<typeof actionSchema>;

const Room = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState("waiting");
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [submittedCount, setSubmittedCount] = useState(0);

  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      actions: ["", "", "", "", ""],
    },
  });

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select()
          .eq("code", code)
          .single();

        if (roomError) throw roomError;
        setRoomId(room.id);
        setRoomStatus(room.status);

        const { data: playersData, error: playersError } = await supabase
          .from("players")
          .select()
          .eq("room_id", room.id);

        if (playersError) throw playersError;
        setPlayers(playersData);
        
        // Find current player
        const currentPlayer = playersData.find(
          (p) => p.id === localStorage.getItem("playerId")
        );
        if (currentPlayer) {
          setCurrentPlayerId(currentPlayer.id);
        }

      } catch (error) {
        console.error("Error fetching room:", error);
        navigate("/");
      }
    };

    fetchRoom();

    const channel = supabase
      .channel("room_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((current) => [...current, payload.new as Player]);
            toast({
              title: "Nouveau joueur",
              description: `${payload.new.username} a rejoint la salle !`,
            });
          } else if (payload.eventType === "UPDATE") {
            setPlayers((current) =>
              current.map((player) =>
                player.id === payload.new.id ? { ...player, ...payload.new } : player
              )
            );
          } else if (payload.eventType === "DELETE") {
            setPlayers((current) =>
              current.filter((player) => player.id !== payload.old.id)
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new.status !== roomStatus) {
            setRoomStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, navigate, roomId, toast, roomStatus]);

  const startGame = async () => {
    if (!roomId) return;
    
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ status: "playing" })
        .eq("id", roomId);

      if (error) throw error;

      toast({
        title: "Partie lancée !",
        description: "Tous les joueurs peuvent maintenant saisir leurs actions.",
      });
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de lancer la partie.",
      });
    }
  };

  const onSubmit = async (values: ActionFormValues) => {
    try {
      // Insert actions
      const promises = values.actions.map((action) =>
        supabase
          .from("player_actions")
          .insert({ player_id: currentPlayerId, action_text: action })
      );

      await Promise.all(promises);

      // Update player status
      await supabase
        .from("players")
        .update({ has_submitted: true })
        .eq("id", currentPlayerId);

      toast({
        title: "Actions soumises !",
        description: "Vos actions ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Error submitting actions:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de soumettre vos actions.",
      });
    }
  };

  useEffect(() => {
    const submittedPlayers = players.filter((p) => p.has_submitted).length;
    setSubmittedCount(submittedPlayers);
  }, [players]);

  if (roomStatus === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
        <div className="max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              Salle d'attente
            </h1>
            <div className="flex items-center justify-center gap-4">
              <p className="text-gray-600">Code de la salle:</p>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(code || "");
                  toast({
                    description: "Code copié !",
                  });
                }}
              >
                {code}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Joueurs</h2>
            <div className="grid gap-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                >
                  <span className="font-medium">{player.username}</span>
                  {player.is_host && (
                    <span className="text-sm text-[#F97316]">Hôte</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={startGame}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
            >
              Lancer la partie
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] p-4">
      <div className="max-w-2xl mx-auto space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
            Saisissez vos actions
          </h1>
          <p className="text-gray-600">
            {submittedCount} / {players.length} joueurs ont soumis leurs actions
          </p>
        </div>

        {!currentPlayer?.has_submitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {form.watch("actions").map((_, index) => (
                <FormField
                  key={index}
                  control={form.control}
                  name={`actions.${index}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={`Action ${index + 1}`}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="submit"
                className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-white"
              >
                Suivant
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center p-8">
            <p className="text-lg text-gray-700">
              Vos actions ont été enregistrées. En attente des autres joueurs...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;