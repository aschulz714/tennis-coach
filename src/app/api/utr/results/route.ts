import { NextRequest, NextResponse } from 'next/server';
import { getPlayerResults } from '@/lib/utr';

export async function POST(request: NextRequest) {
  try {
    const { playerId, year } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required' },
        { status: 400 }
      );
    }

    const results = await getPlayerResults(String(playerId), year);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('UTR results error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
