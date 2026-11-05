"use client";

import { FormEvent, KeyboardEvent, useState } from "react";

type Recommendation = {
  song: {
    name: string;
    artist: string;
    musical_attributes: string[];
    personal_attributes: string[];
  };
  reason: string;
};

export function SongDiscovery() {
  const [prompt, setPrompt] = useState("");
  const [seed, setSeed] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState("");
  const [lastPlayed, setLastPlayed] = useState("");
  const [error, setError] = useState("");

  async function discover(event?: FormEvent, requestedPrompt = prompt) {
    event?.preventDefault();
    if (!requestedPrompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setRecommendations([]);
    try {
      const response = await fetch("/api/songs/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: requestedPrompt, seed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error === "google_ai_not_configured"
          ? "Add GOOGLE_AI_STUDIO_API_KEY to the server environment to enable discovery."
          : data.error === "recommendation_service_failed"
            ? "Google AI Studio couldn't complete the request. Check the Next.js server terminal for its error details."
          : "Could not find recommendations. Please try again.");
      }
      setRecommendations(data.recommendations ?? []);
    } catch (discoverError) {
      setError(discoverError instanceof Error ? discoverError.message : "Could not find recommendations.");
    } finally {
      setLoading(false);
    }
  }

  async function play(song: Recommendation["song"]) {
    const key = `${song.name}-${song.artist}`;
    setPlaying(key);
    setError("");
    try {
      const response = await fetch("/api/spotify/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: song.name, artist: song.artist }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.includes("403")
          ? "Spotify needs playback permission. Disconnect and reconnect Spotify."
          : "Could not start playback. Check that Spotify Premium and an active playback device are available.");
      }
      setLastPlayed(`${song.name} by ${song.artist}`);
      setSeed(`${song.name} by ${song.artist}; musical qualities: ${song.musical_attributes.join(", ")}; personal qualities: ${song.personal_attributes.join(", ")}`);
    } catch (playError) {
      setError(playError instanceof Error ? playError.message : "Could not start playback.");
    } finally {
      setPlaying("");
    }
  }

  function findSimilar() {
    const similarPrompt = "Find songs with a similar emotional and musical feel";
    setPrompt(similarPrompt);
    void discover(undefined, similarPrompt);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="discovery-panel" aria-labelledby="discovery-heading">
      <p className="eyebrow">Your saved songs</p>
      <h2 id="discovery-heading">What do you want to hear?</h2>
      <form id="song-discovery-form" className="discovery-form" onSubmit={discover}>
        <input
          className="discovery-input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want"
          aria-label="Describe what you want"
        />
        <button className="primary-link discovery-submit" type="submit" disabled={loading || !prompt.trim()}>
          {loading ? "Searching…" : "Find songs"}
        </button>
      </form>
      {error && <p className="collection-error" role="alert">{error}</p>}
      {lastPlayed && (
        <div className="similar-row">
          <p className="collection-copy">Playing {lastPlayed}</p>
          <button className="ghost-link" type="button" onClick={findSimilar}>Find similar</button>
        </div>
      )}
      {recommendations.length > 0 && (
        <div className="recommendation-list" aria-live="polite">
          <h3>Recommended for you</h3>
          {recommendations.map(({ song, reason }) => {
            const key = `${song.name}-${song.artist}`;
            return (
              <article className="recommendation-card" key={key}>
                <div>
                  <p className="recommendation-title">{song.name}</p>
                  <p className="track-artists">{song.artist}</p>
                  {reason && <p className="recommendation-reason">{reason}</p>}
                </div>
                <button className="primary-link collection-action" type="button" onClick={() => play(song)} disabled={Boolean(playing)}>
                  {playing === key ? "Playing…" : "Play"}
                </button>
              </article>
            );
          })}
        </div>
      )}
      {!loading && prompt && recommendations.length === 0 && !error && (
        <p className="collection-copy">No saved songs matched this request.</p>
      )}
    </section>
  );
}
