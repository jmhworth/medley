import Link from "next/link";
import { PlaylistBrowser } from "./playlist-browser";
import { getMedleyUser } from "@/lib/supabase/auth";
import { listPlaylists } from "@/lib/spotify/api";
import { hasSpotifySession } from "@/lib/spotify/auth";
import { SongCollection } from "./song-collection";

type HomeProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { user } = await getMedleyUser();
  const connected = await hasSpotifySession();
  const { spotify_error: spotifyError } = await searchParams;
  const accountLabel = user?.email ?? "Signed in";

  if (!connected) {
    return (
      <main className="home-page">
        <div className="home-panel">
          <p className="eyebrow">Medley</p>
          <h1>Playlists</h1>
          <p className="lede">
            Connect your Spotify account to browse your playlists and the songs
            inside them.
          </p>
          <p className="session-line">
            {accountLabel}
            {" · "}
            <Link className="inline-link" href="/auth/logout" prefetch={false}>
              Log out
            </Link>
          </p>
          {spotifyError === "missing_config" && (
            <p className="config-notice">
              Spotify is not configured yet. Add SPOTIFY_CLIENT_ID and
              SPOTIFY_REDIRECT_URI to .env.local, then restart the dev server.
            </p>
          )}
          <Link
            className="primary-link"
            href="/api/spotify/login"
            prefetch={false}
          >
            Connect Spotify
          </Link>
        </div>
      </main>
    );
  }

  const playlists = await listPlaylists();

  return (
    <main className="browse-page">
      <header className="browse-header">
        <div>
          <p className="eyebrow">Medley</p>
          <h1>Your playlists</h1>
          <p className="lede">
            {playlists.length} playlist{playlists.length === 1 ? "" : "s"}. Open
            one to see its tracks.
          </p>
          <p className="session-line">
            {accountLabel}
            {" · "}
            <Link className="inline-link" href="/auth/logout" prefetch={false}>
              Log out
            </Link>
          </p>
        </div>
        <Link className="ghost-link" href="/api/spotify/logout">
          Disconnect
        </Link>
      </header>

      <SongCollection />
      <PlaylistBrowser playlists={playlists} />
    </main>
  );
}
