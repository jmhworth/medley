"use client";

import { useState } from "react";

type CollectionSong = {
  name: string;
  artist: string;
  musical_attributes: string[];
  personal_attributes: string[];
};

function localDayRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
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
      if (!response.ok) throw new Error("Could not load today's plays.");
      const data = await response.json();
      setSongs(data.songs ?? []);
      setCurrentIndex(0);
      setStarted(true);
      setMusicalText("");
      setPersonalText("");
    } catch (collectionError) {
      setError(
        collectionError instanceof Error
          ? collectionError.message
          : "Could not load today's plays.",
      );
    } finally {
      setLoading(false);
    }
  }

  function advance() {
    setCurrentIndex((index) => index + 1);
    setMusicalText("");
    setPersonalText("");
  }

  async function saveAndAdvance() {
    if (!current) return;
    const musical = current.musical_attributes.length
      ? current.musical_attributes
      : parseBullets(musicalText);
    const personal = current.personal_attributes.length
      ? current.personal_attributes
      : parseBullets(personalText);
    if (musical.length === 0 || personal.length === 0) {
      setError("Add at least one bullet to each empty list before saving.");
      return;
    }

    setSaving(true);
    setError("");
    try {
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
      advance();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this song.");
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    if (current?.musical_attributes.length && current.personal_attributes.length) {
      advance();
    }
  }

  return (
    <section className="collection-panel" aria-labelledby="collection-heading">
      <div className="collection-heading-row">
        <div>
          <p className="eyebrow">Song data</p>
          <h2 id="collection-heading">Daily collection</h2>
          <p className="collection-copy">
            Review songs you played today and add what you notice.
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
        </p>
      )}
      {!started ? null : songs.length === 0 ? (
        <p className="collection-copy">No Spotify plays found for today.</p>
      ) : !current ? (
        <p className="collection-copy">All {songs.length} songs reviewed.</p>
      ) : (
        <article className="song-review">
          <p className="collection-progress">
            Song {currentIndex + 1} of {songs.length}
          </p>
          <h3>{current.name}</h3>
          <p className="track-artists">{current.artist}</p>

          <div className="attribute-section">
            <h4>Musical attributes</h4>
            {current.musical_attributes.length ? (
              <ul>
                {current.musical_attributes.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <label className="collection-label">
                Enter one bullet per line
                <textarea
                  className="collection-textarea"
                  value={musicalText}
                  onChange={(event) => setMusicalText(event.target.value)}
                  placeholder={"- bright synths\n- steady rhythm"}
                />
              </label>
            )}
          </div>

          <div className="attribute-section">
            <h4>Personal attributes</h4>
            {current.personal_attributes.length ? (
              <ul>
                {current.personal_attributes.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <label className="collection-label">
                Enter one bullet per line
                <textarea
                  className="collection-textarea"
                  value={personalText}
                  onChange={(event) => setPersonalText(event.target.value)}
                  placeholder={"- reminds me of summer\n- good for a walk"}
                />
              </label>
            )}
          </div>

          <div className="collection-actions">
            <button
              className="primary-link collection-action"
              onClick={saveAndAdvance}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save and next"}
            </button>
            {current.musical_attributes.length > 0 &&
              current.personal_attributes.length > 0 && (
                <button className="ghost-link collection-action" onClick={skip}>
                  Skip
                </button>
              )}
          </div>
        </article>
      )}
    </section>
  );
}
