import { Player } from "./game";

export interface GameAction {
  id: string;
  action_text: string;
  player_id: string;
}

export interface GameState {
  room_id: string;
  current_player_id: string | null;
  current_action_id: string | null;
  dialog_open: boolean;
  ready_count: number;
}