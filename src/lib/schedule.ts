export type TeamName = '4.0 Verma' | '4.5 Dhindsa';

export interface USTAMatch {
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // e.g. "7:45 PM"
  dayOfWeek: string;
  team: TeamName;
  homeAway: 'Home' | 'Away';
  opponent: string;
  venue: string;
}

export interface VacationBlock {
  startDate: string;
  endDate: string;
  label: string;
}

export const USTA_MATCHES: USTAMatch[] = [
  {
    date: '2025-03-28',
    time: '7:45 PM',
    dayOfWeek: 'Sat',
    team: '4.0 Verma',
    homeAway: 'Away',
    opponent: 'AYTC-Maki',
    venue: 'Amy Yee Tennis Center',
  },
  {
    date: '2025-04-10',
    time: '8:30 PM',
    dayOfWeek: 'Fri',
    team: '4.0 Verma',
    homeAway: 'Home',
    opponent: 'TCSP-Wolfpack-Bridgeman',
    venue: 'CAC Silver Lake',
  },
  {
    date: '2025-04-18',
    time: '4:15 PM',
    dayOfWeek: 'Sat',
    team: '4.0 Verma',
    homeAway: 'Away',
    opponent: 'PL-LaMoria',
    venue: 'CAC Pine Lake',
  },
  {
    date: '2025-05-02',
    time: '10:30 AM',
    dayOfWeek: 'Sat',
    team: '4.0 Verma',
    homeAway: 'Away',
    opponent: 'FC-Li',
    venue: 'Forest Crest',
  },
  {
    date: '2025-05-02',
    time: '4:30 PM',
    dayOfWeek: 'Sat',
    team: '4.5 Dhindsa',
    homeAway: 'Away',
    opponent: 'FC-The B Team-Kuo',
    venue: 'Forest Crest',
  },
  {
    date: '2025-05-08',
    time: '8:30 PM',
    dayOfWeek: 'Fri',
    team: '4.5 Dhindsa',
    homeAway: 'Home',
    opponent: 'EDG-Larson',
    venue: 'CAC Silver Lake',
  },
  {
    date: '2025-05-09',
    time: '7:00 PM',
    dayOfWeek: 'Sat',
    team: '4.0 Verma',
    homeAway: 'Home',
    opponent: 'EDG-Hirai',
    venue: 'CAC Silver Lake',
  },
  {
    date: '2025-05-16',
    time: '5:00 PM',
    dayOfWeek: 'Sat',
    team: '4.0 Verma',
    homeAway: 'Away',
    opponent: 'BETC-Hoang',
    venue: 'Boeing Tennis Club',
  },
  {
    date: '2025-05-17',
    time: '5:00 PM',
    dayOfWeek: 'Sun',
    team: '4.5 Dhindsa',
    homeAway: 'Away',
    opponent: "BETC-O'Donnell",
    venue: 'Boeing Tennis Club',
  },
  {
    date: '2025-05-22',
    time: '7:30 PM',
    dayOfWeek: 'Fri',
    team: '4.5 Dhindsa',
    homeAway: 'Away',
    opponent: 'TCSP-Barely Cohering-Liu',
    venue: 'Tennis Center Sand Point',
  },
  {
    date: '2025-05-24',
    time: '8:30 PM',
    dayOfWeek: 'Sun',
    team: '4.0 Verma',
    homeAway: 'Away',
    opponent: 'WSC-Rip N Sip-Low',
    venue: 'Woodinville Sports Club',
  },
  {
    date: '2025-05-29',
    time: '7:00 PM',
    dayOfWeek: 'Fri',
    team: '4.0 Verma',
    homeAway: 'Home',
    opponent: 'BC-Camara',
    venue: 'CAC Silver Lake',
  },
  {
    date: '2025-05-30',
    time: '5:30 PM',
    dayOfWeek: 'Sat',
    team: '4.5 Dhindsa',
    homeAway: 'Home',
    opponent: 'STC-Acers-Williams',
    venue: 'CAC Silver Lake',
  },
  {
    date: '2025-05-31',
    time: '7:00 PM',
    dayOfWeek: 'Sun',
    team: '4.5 Dhindsa',
    homeAway: 'Home',
    opponent: 'AYTC-Soderlind',
    venue: 'CAC Silver Lake',
  },
  {
    date: '2025-06-05',
    time: '8:30 PM',
    dayOfWeek: 'Fri',
    team: '4.0 Verma',
    homeAway: 'Home',
    opponent: 'HBSQ-Yu',
    venue: 'CAC Silver Lake',
  },
  {
    date: '2025-06-07',
    time: '7:00 PM',
    dayOfWeek: 'Sun',
    team: '4.5 Dhindsa',
    homeAway: 'Home',
    opponent: 'HBSQ-McDowell',
    venue: 'CAC Silver Lake',
  },
];

export const VACATION_BLOCKS: VacationBlock[] = [
  {
    startDate: '2025-04-21',
    endDate: '2025-04-30',
    label: 'HAWAII',
  },
];

export function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getScheduleContext(): string {
  const lines = USTA_MATCHES.map((m) => {
    const days = getDaysUntil(m.date);
    const status = days < 0 ? '(past)' : days === 0 ? '(TODAY)' : `(in ${days} days)`;
    return `${m.date} ${m.dayOfWeek} ${m.time} - ${m.team} ${m.homeAway} vs ${m.opponent} at ${m.venue} ${status}`;
  });

  const vacations = VACATION_BLOCKS.map(
    (v) => `${v.startDate} to ${v.endDate}: ${v.label} (blocked out)`
  );

  return [...lines, '', ...vacations].join('\n');
}
