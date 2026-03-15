/**
 * Server-side UTR API helper.
 *
 * Authenticates against the UTR API and provides functions for
 * searching players, fetching profiles, results, and stats.
 *
 * API base URL: The community docs reference both app.universaltennis.com/api/v1
 * and api.universaltennis.com/v2. We use the v1 path via app.universaltennis.com
 * as that appears to be the most reliable based on community usage.
 *
 * Auth: POST login returns a JWT. We cache it in memory with a 55-minute expiry
 * (UTR tokens typically last 1 hour).
 */

const BASE_URL = 'https://app.universaltennis.com/api/v1';

const COMMON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'User-Agent': 'TennisCoach/1.0',
};

// Module-level JWT cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

function getCredentials(): { email: string; password: string } {
  const email = process.env.UTR_EMAIL;
  const password = process.env.UTR_PASSWORD;
  if (!email || !password) {
    throw new Error('UTR_EMAIL and UTR_PASSWORD environment variables are required');
  }
  return { email, password };
}

async function authenticate(): Promise<string> {
  const { email, password } = getCredentials();

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: COMMON_HEADERS,
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`UTR login failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  // The JWT may come back in a few possible shapes depending on the API version.
  // Try common field names.
  const token: string | undefined =
    data.token || data.jwt || data.accessToken || data.access_token;

  if (!token) {
    // Some UTR endpoints set the JWT as a cookie rather than in the body.
    // Check the set-cookie header as a fallback.
    const setCookie = res.headers.get('set-cookie') || '';
    const jwtMatch = setCookie.match(/jwt=([^;]+)/);
    if (jwtMatch) {
      cachedToken = jwtMatch[1];
      tokenExpiry = Date.now() + 55 * 60 * 1000;
      return cachedToken;
    }
    throw new Error('UTR login response did not contain a token');
  }

  cachedToken = token;
  // Cache for 55 minutes (UTR tokens typically expire after 1 hour)
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return token;
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  return authenticate();
}

function clearToken(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

/**
 * Makes an authenticated GET request to the UTR API.
 * On 401, re-authenticates once and retries.
 */
async function utrFetch(path: string, retried = false): Promise<unknown> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      ...COMMON_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 && !retried) {
    clearToken();
    return utrFetch(path, true);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`UTR API error (${res.status}) for ${path}: ${text}`);
  }

  return res.json();
}

// ─── Public API ───────────────────────────────────────────────

export interface UtrPlayerSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  singlesUtr: number;
  doublesUtr: number;
  location: string;
}

export async function searchPlayers(query: string): Promise<UtrPlayerSearchResult[]> {
  const data = await utrFetch(
    `/search/players?query=${encodeURIComponent(query)}&top=10`
  );

  // The search endpoint may return results under different keys.
  // Try common shapes: { hits }, { players }, or the array directly.
  const raw = data as Record<string, unknown>;
  let players: Record<string, unknown>[] = [];

  if (Array.isArray(raw.hits)) {
    players = raw.hits;
  } else if (Array.isArray(raw.players)) {
    players = raw.players;
  } else if (Array.isArray(data)) {
    players = data as Record<string, unknown>[];
  }

  return players.map((p) => ({
    id: (p.id as number) || 0,
    firstName: (p.firstName as string) || '',
    lastName: (p.lastName as string) || '',
    singlesUtr: (p.singlesUtr as number) || (p.thpiSinglesRating as number) || 0,
    doublesUtr: (p.doublesUtr as number) || (p.thpiDoublesRating as number) || 0,
    location: [p.city, p.state, p.nationality].filter(Boolean).join(', ') || '',
  }));
}

export interface UtrPlayerProfile {
  id: number;
  firstName: string;
  lastName: string;
  singlesUtr: number;
  doublesUtr: number;
  ratingStatusSingles: string;
  ratingStatusDoubles: string;
  nationality: string;
  gender: string;
}

export async function getPlayerProfile(playerId: string): Promise<UtrPlayerProfile> {
  const data = (await utrFetch(`/player/${playerId}`)) as Record<string, unknown>;

  return {
    id: (data.id as number) || 0,
    firstName: (data.firstName as string) || '',
    lastName: (data.lastName as string) || '',
    singlesUtr: (data.singlesUtr as number) || (data.thpiSinglesRating as number) || 0,
    doublesUtr: (data.doublesUtr as number) || (data.thpiDoublesRating as number) || 0,
    ratingStatusSingles: (data.ratingStatusSingles as string) || '',
    ratingStatusDoubles: (data.ratingStatusDoubles as string) || '',
    nationality: (data.nationality as string) || '',
    gender: (data.gender as string) || '',
  };
}

export interface UtrMatchResult {
  matchId: string;
  date: string;
  eventName: string;
  opponent: string;
  score: string;
  result: 'win' | 'loss';
}

/**
 * Fetches match results for a player.
 * The results endpoint returns events containing draws containing results.
 * We flatten them into a simple list.
 */
export async function getPlayerResults(
  playerId: string,
  year?: number
): Promise<UtrMatchResult[]> {
  let path = `/player/${playerId}/results`;
  const params: string[] = [];
  if (year) params.push(`year=${year}`);
  params.push('type=singles');
  if (params.length > 0) path += '?' + params.join('&');

  const data = (await utrFetch(path)) as Record<string, unknown>;

  const results: UtrMatchResult[] = [];

  // The response shape is: { events: [{ draws: [{ results: [...] }] }] }
  const events = (data.events as Record<string, unknown>[]) || [];

  for (const event of events) {
    const eventName = (event.name as string) || '';
    const draws = (event.draws as Record<string, unknown>[]) || [];

    for (const draw of draws) {
      const drawResults = (draw.results as Record<string, unknown>[]) || [];

      for (const match of drawResults) {
        const matchResult = parseMatchResult(match, playerId, eventName);
        if (matchResult) {
          results.push(matchResult);
        }
      }
    }
  }

  return results;
}

function parseMatchResult(
  match: Record<string, unknown>,
  playerId: string,
  eventName: string
): UtrMatchResult | null {
  try {
    const id = String(match.id || match.resultId || Math.random());
    const date = (match.date as string) || '';

    // Determine winner/loser from players object
    const players = match.players as Record<string, Record<string, unknown>> | undefined;
    const winner1 = players?.winner1;
    const loser1 = players?.loser1;

    if (!winner1 && !loser1) return null;

    const winnerId = String(winner1?.id || '');
    const loserId = String(loser1?.id || '');
    const isWin = winnerId === playerId;

    const opponent = isWin
      ? [loser1?.firstName, loser1?.lastName].filter(Boolean).join(' ')
      : [winner1?.firstName, winner1?.lastName].filter(Boolean).join(' ');

    // Build score string from the score object
    const scoreObj = match.score as Record<string, Record<string, unknown>> | undefined;
    let scoreStr = '';
    if (scoreObj) {
      const sets: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const set = scoreObj[String(i)];
        if (!set) break;
        // The score object may have winner/loser or team1/team2 scores
        const w = set.winner ?? set.team1;
        const l = set.loser ?? set.team2;
        if (w !== undefined && l !== undefined) {
          // Show from the perspective of the searched player
          if (isWin) {
            sets.push(`${w}-${l}`);
          } else {
            sets.push(`${l}-${w}`);
          }
        }
      }
      scoreStr = sets.join(', ');
    }

    // Fallback to scoreString if available
    if (!scoreStr && match.scoreString) {
      scoreStr = match.scoreString as string;
    }

    return {
      matchId: id,
      date: date.split('T')[0] || date,
      eventName,
      opponent: opponent || 'Unknown',
      score: scoreStr,
      result: isWin ? 'win' : 'loss',
    };
  } catch {
    return null;
  }
}

export interface UtrPlayerStats {
  currentRating: number;
  winsCount: number;
  lossesCount: number;
  recordWinPercentage: string;
}

export async function getPlayerStats(playerId: string): Promise<UtrPlayerStats> {
  const path = `/player/${playerId}/stats?type=singles&resultType=verified&months=12&fetchAllResults=true`;
  const data = (await utrFetch(path)) as Record<string, unknown>;

  return {
    currentRating: (data.currentRating as number) || 0,
    winsCount: (data.winsCount as number) || 0,
    lossesCount: (data.lossesCount as number) || 0,
    recordWinPercentage: (data.recordWinPercentage as string) || '',
  };
}
