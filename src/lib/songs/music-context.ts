import fs from "fs";
import path from "path";
import { listRecentlyPlayed } from "@/lib/spotify/api";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Song } from "./types";

function loadMusicContextParams() {
  const filePath = path.join(process.cwd(), "parameter_files", "music_context.toml");
  const raw = fs.readFileSync(filePath, "utf8");
  return {
    feedbackUpdatesEvery: Number(raw.match(/feedback_updates_every\s*=\s*(\d+)/)?.[1] ?? 3),
    googleAiRequestTimeoutMs: Number(raw.match(/google_ai_request_timeout_ms\s*=\s*(\d+)/)?.[1] ?? 10000),
    googleAiModels: raw.match(/google_ai_models\s*=\s*\[([^\]]+)\]/)?.[1]
      .split(",")
      .map((model) => model.trim().replace(/^"|"$/g, ""))
      .filter(Boolean) ?? ["gemini-3.8-flash", "gemini-3.5-flash-lite"],
  };
}

export async function getMusicContext() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("music_context")
    .select("context_text")
    .maybeSingle();

  if (error) throw error;
  return data?.context_text ?? "";
}

async function incrementFeedbackCount() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("increment_my_music_feedback_count");
  if (error) throw error;
  return Number(data);
}

async function saveMusicContext(contextText: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("music_context")
    .upsert(
      { user_id: userId, context_text: contextText, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

async function getFrequentRecentSongs() {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const played = await listRecentlyPlayed(start.toISOString(), end.toISOString());
  const counts = new Map<string, { name: string; artist: string; play_count: number; last_played: string }>();
  for (const track of played) {
    const key = `${track.name}::${track.artists}`;
    const existing = counts.get(key);
    if (existing) {
      existing.play_count += 1;
      if (track.playedAt > existing.last_played) existing.last_played = track.playedAt;
    } else {
      counts.set(key, { name: track.name, artist: track.artists, play_count: 1, last_played: track.playedAt });
    }
  }
  return [...counts.values()]
    .sort((first, second) => second.play_count - first.play_count || second.last_played.localeCompare(first.last_played))
    .slice(0, 3)
    .map(({ name, artist, play_count }) => ({ name, artist, play_count }));
}

async function generateUpdatedContext(
  currentContext: string,
  song: Omit<Song, "user_id" | "notes">,
  frequentSongs: Awaited<ReturnType<typeof getFrequentRecentSongs>>,
) {
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY?.trim();
  if (!apiKey) throw new Error("google_ai_not_configured");

  const params = loadMusicContextParams();
  const prompt = [
    "Update this listener's persistent music context using only the evidence provided.",
    "Return concise plain text for future music discovery. Separate recurring music preferences from tentative emotional-state signals; describe emotional state as uncertain and temporary, never as a diagnosis.",
    "Treat a recent play-frequency snapshot as short-term evidence, not a lifetime preference. Do not infer genres or tastes without evidence, and do not default to lofi.",
    `Current context (may be empty): ${currentContext || "(empty)"}`,
    `Song feedback just saved: ${JSON.stringify({ name: song.name, artist: song.artist, musical_attributes: song.musical_attributes, personal_attributes: song.personal_attributes })}`,
    `Three most frequent songs in the recent 24-hour Spotify window, if available: ${JSON.stringify(frequentSongs)}`,
  ].join("\n\n");

  let lastError = "";
  for (const model of params.googleAiModels) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
        cache: "no-store",
        signal: AbortSignal.timeout(params.googleAiRequestTimeoutMs),
      });
      if (!response.ok) {
        lastError = `Google AI Studio returned ${response.status}`;
        if ([400, 404, 408, 503, 504].includes(response.status)) continue;
        break;
      }
      const data = await response.json();
      const updatedContext = data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("\n")
        .trim();
      if (!updatedContext) throw new Error("google_ai_empty_context");
      return updatedContext;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(lastError || "google_ai_context_update_failed");
}

export async function updateMusicContextAfterFeedback(
  song: Omit<Song, "user_id" | "notes">,
  userId: string,
) {
  const params = loadMusicContextParams();
  const feedbackCount = await incrementFeedbackCount();
  if (feedbackCount % params.feedbackUpdatesEvery !== 0) return;

  const currentContext = await getMusicContext();
  let frequentSongs: Awaited<ReturnType<typeof getFrequentRecentSongs>> = [];
  try {
    frequentSongs = await getFrequentRecentSongs();
  } catch {
    // Spotify history is optional evidence; the song feedback still supports an update.
  }
  const updatedContext = await generateUpdatedContext(currentContext, song, frequentSongs);
  await saveMusicContext(updatedContext, userId);
}
