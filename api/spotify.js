// Vercel Serverless Function — Spotify Recently Played Proxy
// Returns JSON your custom widget can fetch directly.

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const TOKEN_URL     = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING   = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY      = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

// ── Get a fresh access token using the refresh token ──
async function getAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
    },
    body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(REFRESH_TOKEN),
  });
  const data = await res.json();
  return data.access_token;
}

// ── Main handler ──
export default async function handler(req, res) {
  // CORS — allow your GitHub Pages domain (and localhost for testing)
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  try {
    const token = await getAccessToken();
    const headers = { Authorization: 'Bearer ' + token };

    // 1) Check if something is currently playing
    const nowRes = await fetch(NOW_PLAYING, { headers });

    if (nowRes.status === 200) {
      const now = await nowRes.json();
      if (now.is_playing && now.item) {
        return res.status(200).json({
          is_playing: true,
          track:      now.item.name,
          artist:     now.item.artists.map(a => a.name).join(', '),
          art:        now.item.album.images[0]?.url || '',
          url:        now.item.external_urls.spotify,
          played_at:  null,
          ago:        'now playing',
        });
      }
    }

    // 2) Fall back to most recently played track
    const recentRes = await fetch(RECENTLY, { headers });
    const recent    = await recentRes.json();

    if (recent.items && recent.items.length > 0) {
      const item  = recent.items[0];
      const track = item.track;
      return res.status(200).json({
        is_playing: false,
        track:      track.name,
        artist:     track.artists.map(a => a.name).join(', '),
        art:        track.album.images[0]?.url || '',
        url:        track.external_urls.spotify,
        played_at:  item.played_at,
        ago:        null,
      });
    }

    // 3) Nothing found
    return res.status(200).json({
      is_playing: false,
      track:      null,
      artist:     null,
      art:        null,
      url:        null,
      played_at:  null,
      ago:        '',
    });

  } catch (err) {
    console.error('Spotify proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch Spotify data' });
  }
}
