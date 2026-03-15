import { NextRequest, NextResponse } from 'next/server';
import { searchPlayers } from '@/lib/utr';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    const results = await searchPlayers(query);
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('UTR search error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
