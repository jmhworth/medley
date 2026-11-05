import fs from "fs";
import path from "path";

export function loadDiscoveryParams() {
  const filePath = path.join(process.cwd(), "parameter_files", "song_discovery.toml");
  const raw = fs.readFileSync(filePath, "utf8");
  return {
    minimumKeywordSearches: Number(raw.match(/minimum_keyword_searches\s*=\s*(\d+)/)?.[1] ?? 3),
    maximumKeywordSearches: Number(raw.match(/maximum_keyword_searches\s*=\s*(\d+)/)?.[1] ?? 6),
    recommendationLimit: Number(raw.match(/recommendation_limit\s*=\s*(\d+)/)?.[1] ?? 3),
    geminiModel: raw.match(/gemini_model\s*=\s*"([^"]+)"/)?.[1] ?? "gemini-2.5-flash",
  };
}
