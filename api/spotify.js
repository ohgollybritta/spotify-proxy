const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const TOKEN_URL     = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING   = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY      = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

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
  console.log('[TOKEN]', JSON.stringify(data));
  return data;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const tokenData = await getAccessToken();
    
    if (!tokenData.access_token) {
      return res.status(200).json({ error: 'Token refresh failed', detail: tokenData });
    }

    const token = tokenData.access_token;
    const headers = { Authorization: 'Bearer ' + token };

    const nowRes = await fetch(NOW_PLAYING, { headers });
    console.log('[NOW_PLAYING] status:', nowRes.status);

    if (nowRes.status === 200) {
      const now = await nowRes.json();
      console.log('[NOW_PLAYING] body:', JSON.stringify(now).slice(0, 500));
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

    const recentRes = await fetch(RECENTLY, { headers });
    const recentText = await recentRes.text();
    console.log('[RECENTLY] status:', recentRes.status, 'body:', recentText.slice(0, 500));

    const recent = JSON.parse(recentText);

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

    return res.status(200).json({
      is_playing: false, track: null, artist: null,
      art: null, url: null, played_at: null, ago: '',
      debug_recent: recentText.slice(0, 300),
    });

  } catch (err) {
    console.error('Spotify proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch Spotify data', message: err.message });
  }
}
