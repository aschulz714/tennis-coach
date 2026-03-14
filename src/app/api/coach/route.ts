import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a knowledgeable and encouraging tennis coach. You help players improve their game by:
- Analyzing their practice logs and match results for patterns
- Suggesting drills and exercises tailored to their needs
- Providing tactical advice for matches
- Offering mental game coaching
- Celebrating progress and keeping motivation high

Keep responses concise and actionable. Use tennis terminology naturally. When you see session data, look for trends — are they practicing enough? Winning more? Working on weaknesses?`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  const { messages, sessionContext } = await request.json();

  const client = new Anthropic({ apiKey });

  const systemMessage = sessionContext
    ? `${SYSTEM_PROMPT}\n\nHere is the player's recent session history:\n${sessionContext}`
    : SYSTEM_PROMPT;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemMessage,
    messages,
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  return NextResponse.json({ message: text });
}
