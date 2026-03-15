import { NextRequest, NextResponse } from 'next/server';
import { getPlayerProfile } from '@/lib/utr';

export async function POST(request: NextRequest) {
  try {
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required' },
        { status: 400 }
      );
    }

    const profile = await getPlayerProfile(String(playerId));
    return NextResponse.json(profile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('UTR profile error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
