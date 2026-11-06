"use client";

import { useState } from "react";
import { SongAttributeFeedback } from "./song-attribute-feedback";

type CollectionSong = {
  name: string;
  artist: string;
  musical_attributes: string[];
  personal_attributes: string[];
  play_count: number;
};

function localDayRange() {
  const today = new Date();
  const end = today;
  const start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function parseBullets(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

export function SongCollection() {
  const [songs, setSongs] = useState<CollectionSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [musicalText, setMusicalText] = useState("");
  const [personalText, setPersonalText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const current = songs[currentIndex];

  async function startCollection() {
    setLoading(true);
    setError("");
    const { start, end } = localDayRange();
    try {
      const response = await fetch(
        `/api/songs/collection?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      );
      if (response.status === 403) {
        throw new Error("Spotify needs updated permission to read recent plays.");
      }
      if (response.status === 401) {
        const data = await response.json();
        if (data.error === "spotify_connection_required") {
          throw new Error("Connect Spotify to load recent plays.");
        }
      }
      if (!response.ok) throw new Error("Could not load recent plays.");
      const data = await response.json();
      setSongs(data.songs ?? []);
      setCurrentIndex(0);
      setStarted(true);
      setMusicalText("");
      setPersonalText("");
    } catch (collectionError) {
      console.error("Failed to load song collection", collectionError);
      setError(
        collectionError instanceof Error
          ? collectionError.message
          : "Could not load recent plays.",
      );
    } finally {
      setLoading(false);
    }
  }

  function advance() {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setMusicalText("");
    setPersonalText("");
  }

  async function saveAndAdvance() {
    if (!current) return;
    const musical = [...current.musical_attributes, ...parseBullets(musicalText)];
    const personal = [...current.personal_attributes, ...parseBullets(personalText)];
    const hasSongAttributes = musical.length > 0 && personal.length > 0;
    if (!hasSongAttributes) {
      setError("Add at least one bullet to each empty list before saving.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (hasSongAttributes) {
        const response = await fetch("/api/songs/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: current.name,
            artist: current.artist,
            musical_attributes: musical,
            personal_attributes: personal,
          }),
        });
        if (!response.ok) throw new Error("Could not save this song.");
      }
      advance();
    } catch (saveError) {
      console.error("Failed to save song attributes", saveError);
      setError(saveError instanceof Error ? saveError.message : "Could not save this song.");
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    if (current) advance();
  }

  return (
    <section className="collection-panel" aria-labelledby="collection-heading">
      <div className="collection-heading-row">
        <div>
          <p className="eyebrow">Song data</p>
          <h2 id="collection-heading">Recent listening</h2>
          <p className="collection-copy">
            Review your 50 most recent Spotify plays from the past 24 hours, ranked by play frequency.
          </p>
        </div>
        <button
          className="primary-link collection-start"
          onClick={startCollection}
          disabled={loading}
        >
          {loading ? "Loading…" : "Start collection"}
        </button>
      </div>

      {error && (
        <p className="collection-error" role="alert">
          {error}
          {error.includes("updated permission") && (
            <>
              {" "}
              <a className="inline-link" href="/api/spotify/logout">
                Disconnect Spotify
              </a>
              {" and reconnect to grant access."}
            </>
          )}
          {error.includes("Connect Spotify") && (
            <>
              {" "}
              <a className="inline-link" href="/api/spotify/login">
                Connect Spotify
              </a>
              .
            </>
          )}
        </p>
      )}
      {!started ? null : songs.length === 0 ? (
        <p className="collection-copy">No Spotify plays found in the past 24 hours.</p>
      ) : !current ? (
        <p className="collection-copy">All {songs.length} songs reviewed.</p>
      ) : (
        <article className="song-review">
          <p className="collection-progress">
            Song {currentIndex + 1} of {songs.length}
          </p>
          <h3>{current.name}</h3>
          <p className="track-artists">{current.artist}</p>
          <p className="collection-copy">
            Played {current.play_count} {current.play_count === 1 ? "time" : "times"} in the recent play window
          </p>

          <SongAttributeFeedback musicalAttributes={current.musical_attributes} personalAttributes={current.personal_attributes} musicalText={musicalText} personalText={personalText} onMusicalTextChange={setMusicalText} onPersonalTextChange={setPersonalText} />

          <div className="collection-actions">
            <button
              className="primary-link collection-action"
              onClick={saveAndAdvance}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save and next"}
            </button>
            <button
              className="ghost-link collection-action"
              onClick={skip}
              disabled={saving}
            >
              Skip
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
