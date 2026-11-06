"use client";

import { useState } from "react";

type CollectionSong = {
  name: string;
  artist: string;
  musical_attributes: string[];
  personal_attributes: string[];
  play_count: number;
  moment_note: string;
};

function localDayRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const day = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return { start: start.toISOString(), end: end.toISOString(), day };
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
  const [momentText, setMomentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [started, setStarted] = useState(false);
  const [collectionDay, setCollectionDay] = useState("");
  const [error, setError] = useState("");
  const current = songs[currentIndex];

  async function startCollection() {
    setLoading(true);
    setError("");
    const { start, end, day } = localDayRange();
    try {
      const response = await fetch(
        `/api/songs/collection?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&day=${encodeURIComponent(day)}`,
      );
      if (response.status === 403) {
        throw new Error("Spotify needs updated permission to read recent plays.");
      }
      if (!response.ok) throw new Error("Could not load today's plays.");
      const data = await response.json();
      setSongs(data.songs ?? []);
      setCollectionDay(day);
      setCurrentIndex(0);
      setStarted(true);
      setMusicalText("");
      setPersonalText("");
      setMomentText(data.songs?.[0]?.moment_note ?? "");
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
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setMusicalText("");
    setPersonalText("");
    setMomentText(songs[nextIndex]?.moment_note ?? "");
  }

  async function saveAndAdvance() {
    if (!current) return;
    const musical = current.musical_attributes.length
      ? current.musical_attributes
      : parseBullets(musicalText);
    const personal = current.personal_attributes.length
      ? current.personal_attributes
      : parseBullets(personalText);
    const hasSongAttributes = musical.length > 0 && personal.length > 0;
    const hasMoment = Boolean(momentText.trim() || current.moment_note);
    if (!hasSongAttributes && !hasMoment) {
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
      if (hasMoment) {
        const momentResponse = await fetch("/api/songs/moment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: current.name,
            artist: current.artist,
            day: collectionDay,
            note: momentText.trim(),
            play_count: current.play_count,
          }),
        });
        if (!momentResponse.ok) {
          throw new Error("Song saved, but could not save your note about today.");
        }
      }
      advance();
    } catch (saveError) {
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
          <p className="collection-copy">
            Played {current.play_count} {current.play_count === 1 ? "time" : "times"} today
          </p>

          <div className="attribute-section">
            <h4>What made this song so good today?</h4>
            <label className="collection-label">
              Capture what stood out in this moment. Save and next stores this note.
              <textarea
                className="collection-textarea moment-textarea"
                value={momentText}
                onChange={(event) => setMomentText(event.target.value)}
                placeholder="What did you notice or feel when it came on?"
              />
            </label>
          </div>

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
