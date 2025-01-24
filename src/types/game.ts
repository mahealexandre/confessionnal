export interface Player {
  id: string;
  username: string;
  is_host: boolean;
  has_submitted: boolean;
  room_id: string;
  is_selected: boolean;
}