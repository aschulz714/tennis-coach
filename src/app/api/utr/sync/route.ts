import { NextRequest, NextResponse } from 'next/server';
import { getPlayerResults } from '@/lib/utr';
import { TennisSession } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required' },
        { status: 400 }
      );
    }

    const results = await getPlayerResults(String(playerId));

    // Transform UTR results into TennisSession format
    const sessions: TennisSession[] = results.map((match) => ({
      id: `utr-${match.matchId}`,
      type: 'match' as const,
      date: match.date,
      durationMinutes: 90, // Default estimate for a match
      notes: match.eventName ? `UTR: ${match.eventName}` : 'Imported from UTR',
      opponent: match.opponent,
      score: match.score,
      result: match.result,
      source: 'utr' as const,
      utrMatchId: String(match.matchId),
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({ sessions, count: sessions.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('UTR sync error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
