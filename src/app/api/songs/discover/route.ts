import { NextResponse } from "next/server";
import { searchSongsByKeyword } from "@/lib/songs/db";
import { getMusicContext } from "@/lib/songs/music-context";
import { loadDiscoveryParams } from "@/lib/songs/discovery-params";
import type { Song } from "@/lib/songs/types";
import { getMedleyUser } from "@/lib/supabase/auth";

export const maxDuration = 60;

type ToolSong = Omit<Song, "user_id"> & { id: string };
type Recommendation = { song: Omit<Song, "user_id">; reason: string };

const toolDeclarations = [
  {
    name: "search_song_library",
    description: "Search the user's saved songs for one new descriptive keyword.",
    parameters: {
      type: "OBJECT",
      properties: { keyword: { type: "STRING", description: "One short keyword or phrase" } },
      required: ["keyword"],
    },
  },
  {
    name: "recommend_song",
    description: "Choose one fitting song from the songs returned by search_song_library.",
    parameters: {
      type: "OBJECT",
      properties: {
        song_id: { type: "STRING" },
        reason: { type: "STRING", description: "A short reason this song fits" },
      },
      required: ["song_id", "reason"],
    },
  },
];

export async function POST(request: Request) {
  const { user } = await getMedleyUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "google_ai_not_configured" }, { status: 503 });

  const body = await request.json();
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const seed = typeof body.seed === "string" ? body.seed.trim() : "";
  if (!prompt) return NextResponse.json({ error: "prompt_required" }, { status: 400 });

  const params = loadDiscoveryParams();
  let musicContext = "";
  try {
    musicContext = await getMusicContext();
  } catch {
    // Discovery can still use explicit request and saved-song evidence if context is unavailable.
  }
  const searches: string[] = Array.isArray(body.searches)
    ? [...new Set<string>(body.searches.filter((item: unknown): item is string => typeof item === "string").map((item: string) => item.trim().toLowerCase()).filter(Boolean))].slice(0, params.maximumKeywordSearches)
    : [];
  const previousRecommendations: Recommendation[] = Array.isArray(body.recommendations)
    ? body.recommendations.filter((item: Recommendation) => item?.song?.name && item?.song?.artist).slice(0, params.recommendationLimit)
    : [];

  const library = new Map<string, ToolSong>();
  if (Array.isArray(body.searchResults)) {
    for (const item of body.searchResults) {
      if (typeof item?.id !== "string" || typeof item?.name !== "string" || typeof item?.artist !== "string") continue;
      const key = `${item.name.toLowerCase()}::${item.artist.toLowerCase()}`;
      if (!library.has(key)) {
        library.set(key, {
          id: item.id,
          name: item.name,
          artist: item.artist,
          notes: typeof item.notes === "string" ? item.notes : "",
          musical_attributes: Array.isArray(item.musical_attributes) ? item.musical_attributes : [],
          personal_attributes: Array.isArray(item.personal_attributes) ? item.personal_attributes : [],
        });
      }
    }
  }

  const allowedFunctionNames = searches.length < params.minimumKeywordSearches
    ? ["search_song_library"]
    : searches.length >= params.maximumKeywordSearches || previousRecommendations.length >= params.recommendationLimit
      ? ["recommend_song"]
      : ["search_song_library", "recommend_song"];
  const searchResults = [...library.values()].map(({ id, name, artist, notes, musical_attributes, personal_attributes }) => ({
    id,
    name,
    artist,
    notes,
    musical_attributes,
    personal_attributes,
  }));
  const completedWork = [
    `Keywords already searched: ${searches.length ? searches.join(", ") : "none"}.`,
    `Songs already recommended: ${previousRecommendations.length ? previousRecommendations.map(({ song }) => `${song.name} by ${song.artist}`).join("; ") : "none"}.`,
    `Search results from those keywords (use these saved songs to guide the next search or recommendation): ${JSON.stringify(searchResults)}.`,
    typeof body.feedback === "string" ? `The previous step needs correction: ${body.feedback}` : "",
  ].join(" ");
  const userContext = [
    "Recommend one song given this context:",
    `Original request: ${prompt}`,
    musicContext ? `Known music preferences and recent listener context: ${musicContext}` : "",
    seed ? `A song was just played from Medley: ${seed}` : "",
    completedWork,
    `There are ${library.size} distinct songs from the completed searches available through the tools. Use the search results above to see what the library contains and choose useful new keywords when more searching is needed. Search at least ${params.minimumKeywordSearches} different keywords before recommending, and no more than ${params.maximumKeywordSearches}. Recommend at most one song in this step, only from the tool results, and do not repeat an already recommended song. If there are no fitting songs after the allowed searches, call recommend_song with an empty song_id and explain that no match was found.`,
  ].filter(Boolean).join(" ");

  let response: Response | undefined;
  let providerError = "";
  let data: any;
  for (const model of params.googleAiModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Use the provided tools for all library search and recommendation selection. Make only the next single discovery decision." }] },
          contents: [{ role: "user", parts: [{ text: userContext }] }],
          tools: [{ functionDeclarations: toolDeclarations }],
          toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames } },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(params.googleAiRequestTimeoutMs),
      });
      if (!response.ok) {
        providerError = await response.text();
        if ([400, 404, 408, 503, 504].includes(response.status)) continue;
        break;
      }
      data = await response.json();
    } catch (error) {
      response = undefined;
      providerError = error instanceof Error ? error.message : String(error);
      continue;
    }
    break;
  }

  if (!response || !response.ok) {
    console.error("Google AI Studio request failed", {
      status: response?.status ?? 500,
      body: providerError.slice(0, 1000),
    });
    return NextResponse.json({ error: "recommendation_service_failed" }, { status: 502 });
  }

  const candidate = data.candidates?.[0];
  const call = candidate?.content?.parts?.find((part: { functionCall?: unknown }) => part.functionCall)?.functionCall;
  if (!call) {
    return NextResponse.json({
      searches,
      searchResults,
      done: false,
      feedback: "Choose a tool call for this discovery step. If recommending, use a song id exactly as shown in the search results.",
    });
  }

  if (call.name === "search_song_library") {
    const keyword = String(call.args?.keyword ?? "").trim().toLowerCase();
    if (keyword && !searches.includes(keyword) && searches.length < params.maximumKeywordSearches) {
      try {
        const matches = await searchSongsByKeyword(keyword);
        console.info("AI song library query", { keyword, resultCount: matches.length });
        for (const song of matches) {
          const key = `${song.name.toLowerCase()}::${song.artist.toLowerCase()}`;
          if (!library.has(key)) library.set(key, { ...song, id: `song_${library.size + 1}` });
        }
      } catch (error) {
        console.error("Failed to search saved songs", error);
        return NextResponse.json({ error: "song_search_failed" }, { status: 500 });
      }
      searches.push(keyword);
      return NextResponse.json({ searches, searchResults: [...library.values()], done: false });
    }
    if (searches.length >= params.maximumKeywordSearches) return NextResponse.json({ searches, searchResults, done: true });
    return NextResponse.json({ searches, searchResults, done: false, feedback: "That keyword was empty or already searched. Choose a new, distinct keyword." });
  }

  if (call.name === "recommend_song") {
    const songId = String(call.args?.song_id ?? "");
    if (!songId) return NextResponse.json({ searches, searchResults, done: true });
    const song = library.get(songId);
    if (!song) {
      return NextResponse.json({
        searches,
        searchResults,
        done: false,
        feedback: `The song id "${songId}" is not in the search results. Choose an exact id from the available saved songs.`,
      });
    }
    const repeated = previousRecommendations.some((item) => item.song.name.toLowerCase() === song.name.toLowerCase() && item.song.artist.toLowerCase() === song.artist.toLowerCase());
    if (repeated) return NextResponse.json({ searches, searchResults, done: previousRecommendations.length >= params.recommendationLimit });
    const { id: _id, ...savedSong } = song;
    const recommendation = { song: savedSong, reason: String(call.args?.reason ?? "") };
    return NextResponse.json({
      searches,
      searchResults,
      recommendation,
      done: previousRecommendations.length + 1 >= params.recommendationLimit,
    });
  }

  return NextResponse.json({ searches, searchResults, done: false, feedback: "Use one of the available discovery tools for this step." });
}
