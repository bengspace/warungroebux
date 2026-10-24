// Vercel Serverless Function: Cek Username Roblox + Validasi + Real 3D Avatar Headshot
// Taruh di: api/roblox-check.js  (Node 18+ di Vercel)
// Endpoint: /api/roblox-check?u=USERNAME
// Menggabungkan multi-fallback resmi Roblox:
// 1. POST https://users.roblox.com/v1/usernames/users (Lookup User ID, Username & DisplayName asli)
// 2. Fallback GET https://www.roblox.com/users/profile?username=USERNAME & GET https://users.roblox.com/v1/users/{id}
// 3. Fallback GET https://users.roblox.com/v1/users/search?keyword=USERNAME
// 4. GET https://thumbnails.roblox.com/v1/users/avatar-headshot (Ambil URL foto Avatar 3D riil tr.rbxcdn.com)

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json"
};

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function resolveRobloxUser(u) {
  let authoritativeNotFound = false;

  // Method 1: Official POST /v1/usernames/users (exact username match, returns id, name, displayName)
  for (const host of ["https://users.roblox.com", "https://users.roproxy.com"]) {
    try {
      const r = await fetchWithTimeout(`${host}/v1/usernames/users`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [u], excludeBannedUsers: false })
      });
      if (r.ok) {
        const json = await r.json();
        if (json && Array.isArray(json.data)) {
          if (json.data.length > 0 && json.data[0].id) {
            return { user: json.data[0], notFound: false };
          }
          if (host === "https://users.roblox.com") {
            authoritativeNotFound = true;
          }
        }
      }
    } catch (_) {}
  }

  // Method 2: Roblox Profile Redirect / HTML Meta Extraction (GET /users/profile?username=...)
  if (!authoritativeNotFound) {
    try {
      const profRes = await fetchWithTimeout(
        `https://www.roblox.com/users/profile?username=${encodeURIComponent(u)}`,
        { headers: { "User-Agent": HEADERS["User-Agent"] }, redirect: "follow" }
      );
      if (profRes.status === 404) {
        authoritativeNotFound = true;
      } else if (profRes.ok) {
        const finalUrl = profRes.url || "";
        const html = await profRes.text();
        const idMatch = finalUrl.match(/\/users\/(\d+)\/profile/i) || html.match(/data-userid=["'](\d+)["']/i);
        const nameMatch = html.match(/data-name=["']([^"']+)["']/i);
        const dispMatch = html.match(/data-displayname=["']([^"']+)["']/i);
        if (idMatch && idMatch[1]) {
          const uid = Number(idMatch[1]);
          if (nameMatch && dispMatch) {
            return {
              user: { id: uid, name: nameMatch[1], displayName: dispMatch[1] },
              notFound: false
            };
          }
          const uRes = await fetchWithTimeout(`https://users.roblox.com/v1/users/${uid}`, { headers: HEADERS });
          if (uRes.ok) {
            const uJson = await uRes.json();
            if (uJson && uJson.id) {
              return {
                user: { id: uJson.id, name: uJson.name, displayName: uJson.displayName || uJson.name },
                notFound: false
              };
            }
          }
        }
      }
    } catch (_) {}
  }

  // Method 3: Fallback ke GET /v1/users/search (exact case-insensitive match only)
  if (!authoritativeNotFound) {
    for (const host of ["https://users.roblox.com", "https://users.roproxy.com"]) {
      try {
        const sRes = await fetchWithTimeout(`${host}/v1/users/search?keyword=${encodeURIComponent(u)}&limit=10`, {
          headers: HEADERS
        });
        if (sRes.ok) {
          const sList = (await sRes.json()).data || [];
          const exact = sList.find(item => String(item.name || "").toLowerCase() === u.toLowerCase());
          if (exact && exact.id) {
            return { user: exact, notFound: false };
          }
        }
      } catch (_) {}
    }
  }

  return { user: null, notFound: authoritativeNotFound };
}

async function resolveRobloxAvatar(userId) {
  const endpoints = [
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`,
    `https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
    `https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${userId}&size=150x150&format=Png&isCircular=false`
  ];
  for (const url of endpoints) {
    try {
      const t = await fetchWithTimeout(url, { headers: HEADERS }, 3500);
      if (t.ok) {
        const j = await t.json();
        const img = (((j && j.data) || [])[0] || {}).imageUrl || "";
        if (img && img.startsWith("http")) return img;
      }
    } catch (_) {}
  }
  return "";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  const u = String((req.query || {}).u || (req.query || {}).username || "").replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(u)) {
    return res.status(400).json({ found: false, error: "invalid" });
  }

  try {
    const { user, notFound } = await resolveRobloxUser(u);

    if (!user) {
      return res.status(200).json({
        found: false,
        error: notFound ? "not_found" : "unverified",
        validationMessage: "Username not registered"
      });
    }

    const avatar = await resolveRobloxAvatar(user.id);
    const avatarProxy = avatar
      ? `https://wsrv.nl/?url=${encodeURIComponent(avatar)}&w=150&h=150&fit=cover`
      : "";

    return res.status(200).json({
      found: true,
      valid: true,
      validationEndpoint: `https://auth.roblox.com/v1/usernames/validate?request.username=${encodeURIComponent(user.name)}`,
      validationCode: 1,
      validationMessage: "Username is already in use (Active Roblox Account)",
      id: user.id,
      name: user.name,
      displayName: user.displayName || user.name,
      avatar,
      avatarProxy,
      profileUrl: `https://www.roblox.com/users/profile?username=${encodeURIComponent(user.name)}`,
      directProfileUrl: `https://www.roblox.com/users/${user.id}/profile`
    });
  } catch (e) {
    return res.status(502).json({ found: false, error: "upstream" });
  }
}
