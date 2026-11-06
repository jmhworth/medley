import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Song, SongKey } from "./types";

export async function getSongsForKeys(keys: SongKey[]) {
  if (keys.length === 0) return [];

  const supabase = await createServerSupabaseClient();
  const names = [...new Set(keys.map((key) => key.name))];
  const { data, error } = await supabase
    .from("songs")
    .select("user_id, name, artist, musical_attributes, personal_attributes")
    .in("name", names);

  if (error) throw error;
  return (data ?? []) as Song[];
}

export async function searchSongsByKeyword(keyword: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("search_my_songs", {
    p_keyword: keyword,
  });

  if (error) throw error;
  return (data ?? []) as Song[];
}

export async function saveSong(song: Omit<Song, "user_id">, userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .upsert(
      { ...song, user_id: userId },
      { onConflict: "user_id,name,artist" },
    )
    .select("user_id, name, artist, musical_attributes, personal_attributes")
    .single();

  if (error) throw error;
  return data as Song;
}

export async function getSongMomentsForDay(day: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("song_moments")
    .select("song_name, artist, note")
    .eq("listened_on", day);

  if (error) throw error;
  return data ?? [];
}

export async function saveSongMoment(
  moment: {
    name: string;
    artist: string;
    day: string;
    note: string;
    play_count: number;
  },
  userId: string,
) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("song_moments")
    .upsert(
      {
        user_id: userId,
        song_name: moment.name,
        artist: moment.artist,
        listened_on: moment.day,
        note: moment.note,
        play_count: moment.play_count,
      },
      { onConflict: "user_id,listened_on,song_name,artist" },
    )
    .select("song_name, artist, listened_on, note, play_count")
    .single();

  if (error) throw error;
  return data;
}
