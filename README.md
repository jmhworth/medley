# Medley

> Your music taste, understood over time.

## Deploy to Vercel

Medley is a Next.js App Router app. Import this Git repository into Vercel and keep the detected Next.js framework, install command, and build command (`npm run build`). No custom Vercel build settings or project-local Vercel configuration are required. Add the runtime variables below in **Project Settings → Environment Variables** for Production, then redeploy after changing them.

```dotenv
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_REDIRECT_URI=https://YOUR_PRODUCTION_DOMAIN/api/spotify/callback
GOOGLE_AI_STUDIO_API_KEY=your_google_ai_studio_api_key
SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SCHEMA=medley
```

Replace the uppercase placeholders with your deployed domain and values from Spotify, Google AI Studio, and the active Supabase project. Medley uses Spotify's PKCE flow, so it needs a Spotify Client ID but no Spotify Client Secret. Do not add `SUPABASE_SECRET_KEY`, database URLs, or Supabase access tokens to Vercel; those are not runtime requirements for this app.

Before connecting Spotify, add the exact production callback URL from `SPOTIFY_REDIRECT_URI` to the Spotify app's **Redirect URIs**. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to the same project used by Daedalus. The `medley` schema must already be activated, and `medley` must be listed in that project's **Project Settings → Data API → Exposed schemas**. For Supabase email confirmation links, also set the project's Auth **Site URL** to the production origin and allow that origin in the Auth redirect URL settings.

For reliable Spotify OAuth, use a stable production domain and configure the production environment with its callback URL. Vercel preview deployments have distinct hostnames; Spotify requires each redirect URI to be registered exactly, so previews need their own matching environment value and registered callback before Spotify sign-in will work there. Redeploy whenever a Vercel environment variable changes.

## Local Spotify setup

Set `SPOTIFY_CLIENT_ID`, `SPOTIFY_REDIRECT_URI`, and `GOOGLE_AI_STUDIO_API_KEY` in this project's ignored `.env` file. Register `http://127.0.0.1:3000/api/spotify/callback` as an exact Redirect URI on the same Spotify app, open Medley at `http://127.0.0.1:3000`, and restart the Next.js dev server after changing `.env`. When started through Daedalus, the active project's environment is synchronized into this `.env` file. The dev server allows both `localhost` and `127.0.0.1` so Next's HMR socket continues to work when either loopback name is used. Existing Spotify connections must disconnect and reconnect to grant the new playback permission. Spotify playback may require Premium and an active device.

## Local Supabase auth setup

Medley uses the personalized Supabase project registered and activated for this app in Daedalus, with application data in the `medley` schema and the existing shared Supabase Auth setup. Start Medley through Daedalus so it synchronizes the active project's `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SCHEMA` into this project's ignored `.env` before Next.js starts. For a manually started local server, put those same values in this project's ignored `.env` (the schema should remain `medley`) and restart `npm run dev`. Do not copy `.env.example` to `.env.local`: Next.js prioritizes `.env.local` over `.env`, so empty Supabase entries in that file can hide the Daedalus-synchronized values. If you already made that copy, remove `.env.local` or move its non-secret settings into `.env` and restart. `.env.example` is a template only; Daedalus does not write credentials to it or to parameter files. Under **Authentication → Providers / Email**, turn **Confirm email** off if signup should return a session immediately; this setting affects signup behavior, not whether Supabase is configured. Medley login is required before Spotify connect, discovery, or daily song collection.

## Overview

Medley is a personal music companion that learns how *you* experience music.

Instead of trying to recommend songs based only on genres or listening history, Medley builds a model of your musical preferences, emotional associations, and listening contexts. Over time, it develops an understanding of which songs work best for different moods and activities, helping keep your playlists fresh without requiring constant manual curation.

Spotify remains the player. Medley becomes the intelligence behind the playlists.

---

## Motivation

Most music recommendation systems answer questions like:

* "What songs are similar to this?"
* "What do people with similar tastes enjoy?"

Those are useful, but they don't answer the question that matters most:

> **"What do I want to hear right now?"**

A favorite song can become stale after being played repeatedly, while an older song can suddenly become the perfect choice weeks later. Likewise, two songs may sound similar musically, but only one carries the personal meaning or emotional connection that makes it resonate.

Medley is built around the idea that great recommendations come from understanding both the music and the listener.

---

## Core Ideas

### Musical Understanding

Every song can be described by the characteristics that make it memorable.

Examples include:

* Prominent vocal hooks
* Bass lines and grooves
* Guitar riffs
* Instrumentation
* Harmonic moments
* Emotional intensity
* Genre and overall mood

Rather than reducing music to a single genre, Medley attempts to capture the elements that actually define a song's character.

---

### Personal Meaning

Music is more than sound.

Songs become connected to:

* People
* Memories
* Movies and television
* Places
* Relationships
* Accomplishments
* Different periods of life

These personal associations are often just as important as the music itself.

A song isn't only enjoyable because of how it sounds—it is also enjoyable because of what it represents.

---

### Context Matters

The best song depends on what you're doing.

A track that is perfect while driving may be distracting while working.

Medley learns how songs perform in different situations such as:

* Working
* Studying
* Driving
* Exercising
* Relaxing
* Social settings

---

## Playlist Evolution

Rather than creating playlists once and forgetting them, Medley continuously refines them.

Songs naturally move through a lifecycle:

* Newly discovered
* Active rotation
* Cooling off
* Rediscovered
* Active again

The goal is not to permanently replace songs, but to keep playlists feeling fresh while preserving long-term favorites.

---

## Discovery

Medley doesn't try to search the entire world of music all at once.

Instead, it gradually introduces carefully selected candidates that appear likely to fit your current tastes.

Some become permanent additions.

Others quietly disappear.

Over time, your library evolves naturally.

---

## Long-Term Vision

Medley aims to build a personal map of your musical world.

Instead of organizing songs only by artist or genre, it organizes them by:

* Musical characteristics
* Emotional qualities
* Personal meaning
* Context
* Listening history
* Current relevance

The result is a living representation of your music taste that changes as you do.

---

## Philosophy

Music is deeply personal.

The goal of Medley is not to replace your taste with an algorithm.

The goal is to understand your taste well enough that finding the right song becomes effortless.

Over time, Medley becomes less of a playlist manager and more of a companion that helps you rediscover old favorites, explore new music, and maintain playlists that evolve alongside your life.
