export interface Player {
  id: string;
  username: string;
  room_id: string | null;
  is_host: boolean | null;
  has_submitted: boolean | null;
  ready_for_next_round: boolean | null;
  is_selected: boolean | null;
}

export interface PlayerAction {
  id: string;
  player_id: string;
  action_text: string;
  room_id: string;
  used: boolean | null;
}