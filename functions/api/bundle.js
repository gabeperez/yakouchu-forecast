// Cloudflare Pages Function — GET /api/bundle?lat=&lon=&pc=&hc=
//
// Why this exists: Open-Meteo's servers are in Europe, so a browser in Japan
// round-trips across the planet for each call. This function runs at the
// Cloudflare edge (near the visitor), fetches all the upstreams server-side,
// edge-caches the result, and returns ONE small bundle — much faster and more
// reliable than three transpacific fetches from the client. The client falls
// back to calling the APIs directly if this isn't deployed, so it's optional.

export async function onRequestGet({ request }) {
  const u = new URL(request.url);
  const lat = u.searchParams.get('lat');
  const lon = u.searchParams.get('lon');
  const pc  = u.searchParams.get('pc');
  const hc  = u.searchParams.get('hc');
  if (!lat || !lon) return json({ error: 'lat and lon are required' }, 400);

  // today's date in JST: shift "now" by +9h, then read the UTC parts (= JST wall clock)
  const j = new Date(Date.now() + 9 * 3600 * 1000);
  const yr = j.getUTCFullYear(), mn = j.getUTCMonth() + 1, dy = j.getUTCDate();

  const base = `latitude=${lat}&longitude=${lon}&timezone=Asia%2FTokyo&forecast_days=7`;
  const fxURL = `https://api.open-meteo.com/v1/forecast?${base}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover`;
  const mxURL = `https://marine-api.open-meteo.com/v1/marine?${base}&hourly=sea_surface_temperature,wave_height`;
  // cache each upstream at the Cloudflare edge for 30 min (forecasts only move hourly)
  const cf = { cf: { cacheTtl: 1800, cacheEverything: true } };

  const get = async (url) => {
    try { const r = await fetch(url, cf); return r.ok ? await r.json() : null; }
    catch { return null; }
  };

  const tasks = [get(fxURL), get(mxURL)];
  if (pc && hc) tasks.push(get(`https://tide736.net/api/get_tide.php?pc=${pc}&hc=${hc}&yr=${yr}&mn=${mn}&dy=${dy}&rg=week`));
  const [fx, mx, td] = await Promise.all(tasks);

  if (!fx || !mx) return json({ error: 'upstream unavailable' }, 502);
  return json({ fx, mx, td: td || null }, 200);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      // visitors may reuse for 10 min; the edge holds it 30 min
      'cache-control': 'public, max-age=600, s-maxage=1800'
    }
  });
}
