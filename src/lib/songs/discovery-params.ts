import fs from "fs";
import path from "path";

export function loadDiscoveryParams() {
  const filePath = path.join(process.cwd(), "parameter_files", "song_discovery.toml");
  const raw = fs.readFileSync(filePath, "utf8");
  return {
    minimumKeywordSearches: Number(raw.match(/minimum_keyword_searches\s*=\s*(\d+)/)?.[1] ?? 3),
    maximumKeywordSearches: Number(raw.match(/maximum_keyword_searches\s*=\s*(\d+)/)?.[1] ?? 6),
    recommendationLimit: Number(raw.match(/recommendation_limit\s*=\s*(\d+)/)?.[1] ?? 3),
    googleAiRequestTimeoutMs: Number(raw.match(/google_ai_request_timeout_ms\s*=\s*(\d+)/)?.[1] ?? 10000),
    googleAiModels: raw.match(/google_ai_models\s*=\s*\[([^\]]+)\]/)?.[1]
      .split(",")
      .map((model) => model.trim().replace(/^"|"$/g, ""))
      .filter(Boolean) ?? ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemma-4-31b-it", "gemma-4-26b-a4b-it"],
  };
}
