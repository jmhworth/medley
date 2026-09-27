export type Song = {
  user_id: string;
  name: string;
  artist: string;
  musical_attributes: string[];
  personal_attributes: string[];
};

export type SongKey = {
  name: string;
  artist: string;
};
