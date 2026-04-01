# Spotify Proxy for GitHub Pages

A tiny Vercel serverless function that returns your recently played
(or currently playing) Spotify track as JSON — so your custom widget
keeps working after moving from Dreamhost to GitHub Pages.

---

## Setup (≈10 minutes)

### Step 1 — Create a Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Click **Create App**
3. Name it anything (e.g. "Portfolio Widget")
4. Set the **Redirect URI** to: `http://localhost:8888/callback`
5. Save. Copy your **Client ID** and **Client Secret**.

### Step 2 — Get Your Refresh Token

Run this once on your machine (requires Node.js):

```bash
node get-refresh-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET
```

It opens a browser URL → you authorize → it prints your refresh token.

### Step 3 — Deploy to Vercel

1. Push this folder to a new GitHub repo (e.g. `spotify-proxy`)
2. Go to https://vercel.com → **Add New Project** → import that repo
3. In **Environment Variables**, add:
   - `SPOTIFY_CLIENT_ID` → your client ID
   - `SPOTIFY_CLIENT_SECRET` → your client secret
   - `SPOTIFY_REFRESH_TOKEN` → the token from Step 2
4. Deploy. Your endpoint will be at:
   `https://your-project-name.vercel.app/api/spotify`

### Step 4 — Update Your Site

In your `index.html`, find this line:

```js
fetch('/spotify-proxy.php')
```

Replace it with:

```js
fetch('https://your-project-name.vercel.app/api/spotify')
```

That's it. Your widget works again.

---

## JSON Response Format

```json
{
  "is_playing": false,
  "track": "Song Name",
  "artist": "Artist Name",
  "art": "https://i.scdn.co/image/...",
  "url": "https://open.spotify.com/track/...",
  "played_at": "2026-04-01T12:00:00.000Z",
  "ago": null
}
```

This matches the fields your existing `updateWidget()` function expects.
