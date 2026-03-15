'use client';

import { USTA_MATCHES, VACATION_BLOCKS, getDaysUntil } from '@/lib/schedule';

export default function Schedule() {
  // Build a combined timeline: matches + vacation blocks, sorted by date
  type ScheduleItem =
    | { type: 'match'; data: (typeof USTA_MATCHES)[0]; daysUntil: number }
    | { type: 'vacation'; data: (typeof VACATION_BLOCKS)[0]; daysUntil: number };

  const items: ScheduleItem[] = [];

  for (const match of USTA_MATCHES) {
    items.push({
      type: 'match',
      data: match,
      daysUntil: getDaysUntil(match.date),
    });
  }

  for (const vac of VACATION_BLOCKS) {
    items.push({
      type: 'vacation',
      data: vac,
      daysUntil: getDaysUntil(vac.startDate),
    });
  }

  items.sort((a, b) => {
    const dateA = a.type === 'match' ? a.data.date : a.data.startDate;
    const dateB = b.type === 'match' ? b.data.date : b.data.startDate;
    return dateA.localeCompare(dateB);
  });

  // Find the first upcoming match (next up)
  const nextUpIndex = items.findIndex(
    (item) => item.type === 'match' && item.daysUntil >= 0
  );

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function countdownText(days: number) {
    if (days < 0) return '';
    if (days === 0) return 'TODAY';
    if (days === 1) return 'Tomorrow';
    return `${days}d away`;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-neutral-400 mb-3">
        USTA League Schedule
      </h2>

      {items.map((item, i) => {
        if (item.type === 'vacation') {
          const vac = item.data;
          const isPast = getDaysUntil(vac.endDate) < 0;
          return (
            <div
              key={`vac-${i}`}
              className={`rounded-lg p-3 border border-dashed ${
                isPast
                  ? 'border-neutral-700 bg-neutral-900 opacity-50'
                  : 'border-amber-600 bg-amber-950/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm">
                  {isPast ? '' : '\u2708'}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isPast ? 'text-neutral-500' : 'text-amber-400'
                  }`}
                >
                  {vac.label}
                </span>
                <span className="text-xs text-neutral-500 ml-auto">
                  {formatDate(vac.startDate)} - {formatDate(vac.endDate)}
                </span>
              </div>
            </div>
          );
        }

        const match = item.data;
        const isPast = item.daysUntil < 0;
        const isNextUp = i === nextUpIndex;
        const isVerma = match.team === '4.0 Verma';

        return (
          <div
            key={`match-${i}`}
            className={`rounded-lg p-3 border transition ${
              isNextUp
                ? 'border-green-500 bg-green-950/30 ring-1 ring-green-500/30'
                : isPast
                ? 'border-neutral-800 bg-neutral-900 opacity-50'
                : 'border-neutral-700 bg-neutral-800'
            }`}
          >
            {/* Top row: date + countdown */}
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`text-sm font-medium shrink-0 ${
                    isPast ? 'text-neutral-500' : 'text-neutral-200'
                  }`}
                >
                  {formatDate(match.date)}
                </span>
                <span className="text-xs text-neutral-500 shrink-0">{match.time}</span>
              </div>
              {!isPast && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                    isNextUp
                      ? 'bg-green-600 text-white'
                      : 'bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {isNextUp ? 'NEXT UP' : ''}{' '}
                  {countdownText(item.daysUntil)}
                </span>
              )}
            </div>

            {/* Team badge + home/away */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  isVerma
                    ? 'bg-blue-900 text-blue-300'
                    : 'bg-purple-900 text-purple-300'
                }`}
              >
                {match.team}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${
                  match.homeAway === 'Home'
                    ? 'bg-green-900 text-green-300'
                    : 'bg-neutral-700 text-neutral-400'
                }`}
              >
                {match.homeAway}
              </span>
            </div>

            {/* Opponent */}
            <div
              className={`text-sm ${
                isPast ? 'text-neutral-500' : 'text-neutral-300'
              }`}
            >
              vs {match.opponent}
            </div>
            {/* Venue */}
            <div className="text-xs text-neutral-500 truncate mt-0.5">
              {match.venue}
            </div>
          </div>
        );
      })}
    </div>
  );
}
