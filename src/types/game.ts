export interface Player {
  id: string;
  username: string;
  is_host?: boolean;
  has_submitted?: boolean;
  ready_for_next_round?: boolean;
  is_selected?: boolean;
}