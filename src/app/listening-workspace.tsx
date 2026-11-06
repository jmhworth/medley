"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SpotifyPlaylist, SpotifyTrack } from "@/lib/spotify/api";
import { PlaylistBrowser } from "./playlist-browser";
import { SongCollection } from "./song-collection";
import { SongDiscovery } from "./song-discovery";
import { SongAttributeFeedback } from "./song-attribute-feedback";

type Song = { name: string; artist: string; notes: string; musical_attributes: string[]; personal_attributes: string[] };
type QueueTrack = { spotifyId?: string; song: Song };

export function ListeningWorkspace() {
  const [tab, setTab] = useState("Library + Search");
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selected, setSelected] = useState<QueueTrack | null>(null);
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [musicalText, setMusicalText] = useState("");
  const [personalText, setPersonalText] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/spotify/playlists").then((response) => response.json()).then((data) => setPlaylists(data.playlists ?? []));
  }, []);

  function selectPlaylistTrack(track: SpotifyTrack, tracks: SpotifyTrack[]) {
    const nextQueue = tracks.map((item) => ({ spotifyId: item.id, song: { name: item.name, artist: item.artists, notes: "", musical_attributes: [], personal_attributes: [] } }));
    const selectedIndex = nextQueue.findIndex((item) => item.spotifyId === track.id);
    setQueue(nextQueue);
    setSelected(nextQueue[selectedIndex]);
    setMusicalText("");
    setPersonalText("");
    setMessage("");
    setTab("Play + Feedback");
  }

  function selectSearchSong(song: Song, _spotifyId?: string, songs: Song[] = []) {
    const nextQueue = songs.map((item) => ({ song: item }));
    const selectedIndex = nextQueue.findIndex((item) => item.song.name === song.name && item.song.artist === song.artist);
    setQueue(nextQueue);
    setSelected(nextQueue[selectedIndex] ?? { song });
    setMusicalText("");
    setPersonalText("");
    setMessage("");
    setTab("Play + Feedback");
  }

  function updateSearchQueue(songs: Song[]) {
    setQueue(songs.map((song) => ({ song })));
  }

  async function playCurrent() {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/spotify/play", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected.spotifyId ? { spotifyId: selected.spotifyId } : { name: selected.song.name, artist: selected.song.artist }),
    });
    if (response.ok) {
      setMessage("Playing on Spotify.");
    } else {
      const data = await response.json();
      setMessage(data.error === "spotify_session_missing"
        ? "Your Spotify connection is missing. Connect Spotify again to keep listening."
        : "Could not start playback. Check Spotify permissions and your active device.");
    }
    setBusy(false);
  }

  async function saveNotes() {
    if (!selected) return;
    const bullets = (text: string, existing: string[]) => [...existing, ...text.split("\n").map((line) => line.trim().replace(/^[-•]\s*/, "")).filter(Boolean)];
    const musical = bullets(musicalText, selected.song.musical_attributes);
    const personal = bullets(personalText, selected.song.personal_attributes);
    if (!musical.length || !personal.length) {
      setMessage("Add at least one musical and one personal note before saving.");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/songs/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...selected.song, musical_attributes: musical, personal_attributes: personal }) });
    setBusy(false);
    setMessage(response.ok ? "Notes saved." : "Could not save these notes.");
    if (response.ok) {
      setSelected({ ...selected, song: { ...selected.song, musical_attributes: musical, personal_attributes: personal } });
      setMusicalText("");
      setPersonalText("");
    }
  }

  function skip() {
    if (!selected || !queue.length) return;
    const index = queue.findIndex((item) => item.spotifyId === selected.spotifyId && item.song.name === selected.song.name);
    const next = queue[(index + 1) % queue.length];
    setSelected(next);
    setMusicalText("");
    setPersonalText("");
    setMessage("");
  }

  return <>
    <nav className="listening-tabs" aria-label="Listening sections">{["Library + Search", "Feedback", "Play + Feedback"].map((name) => <button key={name} className={tab === name ? "listening-tab active" : "listening-tab"} onClick={() => setTab(name)}>{name}</button>)}</nav>
    <div style={{ display: tab === "Library + Search" ? undefined : "none" }}>
      <section className="discovery-panel"><p className="eyebrow">Your library</p><h2>Play a playlist</h2><PlaylistBrowser playlists={playlists} onSelectTrack={selectPlaylistTrack} /></section>
      <SongDiscovery onSelectSong={selectSearchSong} onRecommendations={updateSearchQueue} />
    </div>
    {tab === "Feedback" && <SongCollection />}
    {tab === "Play + Feedback" && <section className="collection-panel"><p className="eyebrow">Now playing</p>{selected ? <><h2>{selected.song.name}</h2><p className="track-artists">{selected.song.artist}</p><div className="collection-actions"><button className="primary-link collection-action" onClick={playCurrent} disabled={busy}>{busy ? "Starting…" : "Play"}</button><button className="ghost-link collection-action" onClick={skip}>Skip</button></div><SongAttributeFeedback musicalAttributes={selected.song.musical_attributes} personalAttributes={selected.song.personal_attributes} musicalText={musicalText} personalText={personalText} onMusicalTextChange={setMusicalText} onPersonalTextChange={setPersonalText} /><button className="primary-link collection-action" onClick={saveNotes} disabled={busy}>Save notes</button>{message && <p className="collection-copy" role="status">{message}{message.startsWith("Your Spotify connection is missing") && <> <Link className="inline-link" href="/api/spotify/login" prefetch={false}>Connect Spotify</Link></>}</p>}</> : <p className="collection-copy">Choose a playlist track or search recommendation to start listening.</p>}</section>}
  </>;
}
