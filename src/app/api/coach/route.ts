import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getScheduleContext } from '@/lib/schedule';

const SYSTEM_PROMPT = `You are a knowledgeable and encouraging tennis coach for a USTA league doubles player. Key context:

PLAYER PROFILE:
- Plays on TWO USTA league teams: 4.0 (Captain: Verma) and 4.5 (Captain: Dhindsa)
- Home courts: CAC Silver Lake
- Primarily plays doubles (USTA league is doubles format)
- Match format: best of 3 sets, with a 10-point match tiebreak in lieu of a third set (USTA standard)
- Improving player working to compete at both the 4.0 and 4.5 level

COACHING FOCUS:
- Give doubles-specific tactical advice: positioning, poaching, serving patterns, return formation, I-formation, communication with partner
- When analyzing matches, consider doubles dynamics: net play, lob defense, cross-court vs down-the-line, who's serving/returning
- For 4.5 matches, emphasize the step up in pace, consistency, and tactical awareness needed
- Reference the player's logged data when giving advice — look for patterns in wins vs losses, performance by team, surface, partner

UPCOMING SCHEDULE:
${getScheduleContext()}

Use the schedule to give timely advice — if a match is coming up soon, focus preparation on that opponent/venue. If there's a gap between matches, suggest practice priorities.

Keep responses concise and actionable. Use tennis terminology naturally. When you see session data, look for trends — are they practicing enough? Winning more? Working on weaknesses? Is their 4.0 vs 4.5 performance different?`;

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
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemMessage,
    messages,
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  return NextResponse.json({ message: text });
}
