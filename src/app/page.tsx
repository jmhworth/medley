import Link from "next/link";
import { getMedleyUser } from "@/lib/supabase/auth";
import { hasSpotifySession } from "@/lib/spotify/auth";
import { ListeningWorkspace } from "./listening-workspace";

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
          <h1>Find your next song</h1>
          <p className="lede">
            Connect Spotify to play songs you have saved in Medley.
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
              SPOTIFY_REDIRECT_URI to the ignored .env file, then restart the dev server.
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

  return (
    <main className="browse-page">
      <header className="browse-header">
        <div>
          <p className="eyebrow">Medley</p>
          <h1>Find your next song</h1>
          <p className="lede">
            Describe the mood, moment, or sound you want. Medley will search
            your saved songs and find a few that fit.
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

      <ListeningWorkspace />
    </main>
  );
}
