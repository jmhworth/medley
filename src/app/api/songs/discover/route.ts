import { NextResponse } from "next/server";
import { searchSongsByKeyword } from "@/lib/songs/db";
import { loadDiscoveryParams } from "@/lib/songs/discovery-params";
import type { Song } from "@/lib/songs/types";
import { getMedleyUser } from "@/lib/supabase/auth";

type ToolSong = Song & { id: string };
type Recommendation = { song: Song; reason: string };

const toolDeclarations = [
  {
    name: "search_song_library",
    description: "Search the user's saved songs for one descriptive keyword. Use a different keyword each time, such as mood, activity, energy, or sound.",
    parameters: {
      type: "OBJECT",
      properties: { keyword: { type: "STRING", description: "One short keyword or phrase" } },
      required: ["keyword"],
    },
  },
  {
    name: "save_recommendations",
    description: "Select one fitting song from the songs returned by search_song_library and add it to the recommendation list.",
    parameters: {
      type: "OBJECT",
      properties: {
        recommendations: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              song_id: { type: "STRING" },
              reason: { type: "STRING", description: "A short reason this song fits" },
            },
            required: ["song_id", "reason"],
          },
        },
      },
      required: ["recommendations"],
    },
  },
];

function responseText(candidate: { content?: { parts?: { text?: string }[] } }) {
  return (candidate.content?.parts ?? []).map((part) => part.text ?? "").join(" ").trim();
}

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
  const searches = new Set<string>();
  const library = new Map<string, ToolSong>();
  const recommendations: Recommendation[] = [];
  const encoder = new TextEncoder();
  const instructions = [
    "You recommend songs only from the user's saved Medley library.",
    `Search at least ${params.minimumKeywordSearches} different keywords before saving recommendations, and never search more than ${params.maximumKeywordSearches} different keywords.`,
    "Choose a varied set of useful search terms inferred from the request. Continue searching if results are sparse.",
    `Save up to ${params.recommendationLimit} songs using save_recommendations, one song at a time so each can be delivered immediately. Only use song_id values returned by search_song_library.`,
    "If there are no fitting songs, search more terms and save an empty list. Do not invent songs.",
    seed ? `A song was just played from Medley: ${seed}. Find songs with related emotional and musical qualities, guided by the user's request: ${prompt}` : `User request: ${prompt}`,
  ].join(" ");
  const contents: object[] = [{ role: "user", parts: [{ text: instructions }] }];
  let finalText = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        for (let turn = 0; turn < params.maximumKeywordSearches + 3; turn += 1) {
    const allowedFunctionNames = searches.size >= params.maximumKeywordSearches
      ? ["save_recommendations"]
      : searches.size < params.minimumKeywordSearches
        ? ["search_song_library"]
        : ["search_song_library", "save_recommendations"];
    let response: Response | undefined;
    let providerError = "";
    for (const model of params.googleAiModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "Use the provided tools for all library search and recommendation selection. Follow the search limits exactly." }] },
          contents,
          tools: [{ functionDeclarations: toolDeclarations }],
          toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames } },
        }),
        cache: "no-store",
      });
      if (response.ok) break;
      providerError = await response.text();
      if (response.status !== 400 && response.status !== 404 && response.status !== 503) break;
    }
    if (!response || !response.ok) {
      console.error("Google AI Studio request failed", {
        status: response?.status ?? 500,
        body: providerError.slice(0, 1000),
      });
          send({ type: "error", error: "recommendation_service_failed" });
          break;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate?.content) break;
    contents.push(candidate.content);
    finalText = responseText(candidate);
    const calls = candidate.content.parts?.filter((part: { functionCall?: unknown }) => part.functionCall) ?? [];
    if (calls.length === 0) break;

    const functionResponses = [];
    for (const part of calls) {
      const call = part.functionCall;
      if (call.name === "search_song_library") {
        const keyword = String(call.args?.keyword ?? "").trim().toLowerCase();
        if (!keyword || searches.has(keyword)) {
          functionResponses.push({ functionResponse: { name: call.name, response: { result: "Choose a new, distinct keyword." } } });
          continue;
        }
        if (searches.size >= params.maximumKeywordSearches) {
          functionResponses.push({ functionResponse: { name: call.name, response: { result: "Search limit reached. Save recommendations from the songs already found." } } });
          continue;
        }
        searches.add(keyword);
        let matches: Song[];
        try {
          matches = await searchSongsByKeyword(keyword);
        } catch (error) {
          console.error("Failed to search saved songs", error);
              send({ type: "error", error: "song_search_failed" });
              return;
        }
        console.info("AI song library query", { keyword, resultCount: matches.length });
        const results = matches.map((song) => {
          const id = `song_${library.size + 1}`;
          const entry = { ...song, id };
          library.set(id, entry);
          return { id, name: song.name, artist: song.artist, musical_attributes: song.musical_attributes, personal_attributes: song.personal_attributes };
        });
        functionResponses.push({ functionResponse: { name: call.name, response: { keyword, songs: results } } });
      } else if (call.name === "save_recommendations") {
        if (searches.size < params.minimumKeywordSearches) {
          functionResponses.push({ functionResponse: { name: call.name, response: { result: "Search at least three distinct keywords first." } } });
          continue;
        }
        const requested = Array.isArray(call.args?.recommendations) ? call.args.recommendations : [];
        const remainingSlots = params.recommendationLimit - recommendations.length;
        for (const item of requested.slice(0, Math.min(1, remainingSlots))) {
          const song = library.get(String(item.song_id));
          if (song && !recommendations.some((recommendation) => recommendation.song.name === song.name && recommendation.song.artist === song.artist)) {
            const { id: _id, ...savedSong } = song;
            const recommendation = { song: savedSong, reason: String(item.reason ?? "") };
            recommendations.push(recommendation);
            send({ type: "recommendation", recommendation });
          }
        }
        functionResponses.push({ functionResponse: { name: call.name, response: { saved_count: recommendations.length } } });
      }
    }
    contents.push({ role: "user", parts: functionResponses });
          if (recommendations.length >= params.recommendationLimit) break;
        }
        send({ type: "complete", searches: [...searches], message: finalText });
      } catch (error) {
        console.error("Song discovery stream failed", error);
        send({ type: "error", error: "recommendation_service_failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}
