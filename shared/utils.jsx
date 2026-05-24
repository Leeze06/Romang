// Shared utilities — parses WEEKLY_DATA and computes per-player aggregates.
// Exposed on window for sibling Babel scripts.

(function () {
  const DATA = window.WEEKLY_DATA || {};
  const WEEK_NAMES = Object.keys(DATA);

  // Status priority: green > yellow > red > gray (for "best status this week" rollups)
  const STATUS_RANK = { green: 3, yellow: 2, red: 1, gray: 0, null: 0 };

  function parseWL(text) {
    const s = String(text || '');
    const wins = (s.match(/W/g) || []).length;
    const losses = (s.match(/L/g) || []).length;
    return { wins, losses, plays: wins + losses };
  }

  function parseCount(text) {
    const n = parseInt(text || '0', 10);
    return Number.isFinite(n) ? n : 0;
  }

  // Returns { dayCount, dayCols, totalIdx, hasPrev }
  function weekShape(week) {
    const totalIdx = week.columns.findIndex((c) => String(c).startsWith('합산'));
    const dayCount = totalIdx - 1;
    const dayCols = week.columns.slice(1, 1 + dayCount);
    const hasPrev = week.columns.some((c) => String(c).includes('저번주'));
    return { dayCount, dayCols, totalIdx, hasPrev };
  }

  // Per-row stats for a single week row
  function rowStats(week, row) {
    const { dayCount } = weekShape(week);
    const days = row.before.slice(1, 1 + dayCount);
    if (week.mode === 'wl') {
      let wins = 0, losses = 0, plays = 0;
      days.forEach((d) => {
        const r = parseWL(d);
        wins += r.wins;
        losses += r.losses;
        plays += r.plays;
      });
      const rate = plays ? Math.round((wins / plays) * 100) : 0;
      return { wins, losses, plays, rate, mode: 'wl' };
    } else {
      let count = 0;
      days.forEach((d) => { count += parseCount(d); });
      return { plays: count, mode: 'count' };
    }
  }

  // Per-day rollup (across all players) for a single week
  function dayRollup(week, dayIdx) {
    if (week.mode === 'wl') {
      let wins = 0, losses = 0, plays = 0;
      week.rows.forEach((row) => {
        const v = row.before[1 + dayIdx];
        const r = parseWL(v);
        wins += r.wins;
        losses += r.losses;
        plays += r.plays;
      });
      const rate = plays ? Math.round((wins / plays) * 100) : 0;
      return { wins, losses, plays, rate };
    } else {
      let count = 0;
      week.rows.forEach((row) => { count += parseCount(row.before[1 + dayIdx]); });
      return { plays: count };
    }
  }

  // Cumulative per-player stats across all weeks
  function buildPlayerIndex() {
    const index = {}; // nick -> { weeks: [{weekName, status, ...stats}], totals: {...} }
    const latestWeekName = WEEK_NAMES[WEEK_NAMES.length - 1];
    const latestNicks = new Set((DATA[latestWeekName]?.rows || []).map((r) => r.before[0]));

    WEEK_NAMES.forEach((weekName) => {
      const week = DATA[weekName];
      week.rows.forEach((row) => {
        const nick = row.before[0];
        if (!nick) return;
        if (!index[nick]) index[nick] = { nick, weeks: [], totals: { plays: 0, wins: 0, losses: 0, weeksGreen: 0, weeksRed: 0, weeksYellow: 0, weeksGray: 0 }, hasLeftNote: false, lastWeek: null };
        const stats = rowStats(week, row);
        index[nick].weeks.push({ weekName, status: row.status, notes: row.after.join(' '), ...stats });
        index[nick].totals.plays += stats.plays || 0;
        if (stats.mode === 'wl') {
          index[nick].totals.wins += stats.wins || 0;
          index[nick].totals.losses += stats.losses || 0;
        }
        const key = row.status === 'green' ? 'weeksGreen'
                 : row.status === 'red' ? 'weeksRed'
                 : row.status === 'yellow' ? 'weeksYellow'
                 : 'weeksGray';
        index[nick].totals[key] += 1;
        // detect "길탈" anywhere in notes (also "길드탈퇴" variants)
        const noteStr = (row.after || []).join(' ');
        if (/길탈|길드\s*탈퇴|탈퇴/.test(noteStr)) index[nick].hasLeftNote = true;
        index[nick].lastWeek = weekName;
      });
    });
    // compute winRate on totals, mark left status
    Object.values(index).forEach((p) => {
      const t = p.totals;
      const wl = t.wins + t.losses;
      t.winRate = wl ? Math.round((t.wins / wl) * 100) : null;
      t.weeksTotal = p.weeks.length;
      // "left" = explicit 길탈 note OR not present in the latest week
      p.inLatestWeek = latestNicks.has(p.nick);
      p.left = p.hasLeftNote || !p.inLatestWeek;
    });
    return index;
  }

  // Week-level rollup (total plays, summary status mix, win rate)
  function weekRollup(week) {
    let plays = 0, wins = 0, losses = 0;
    const statusMix = { green: 0, red: 0, yellow: 0, gray: 0 };
    week.rows.forEach((row) => {
      const s = rowStats(week, row);
      plays += s.plays || 0;
      wins += s.wins || 0;
      losses += s.losses || 0;
      const key = row.status === 'green' ? 'green'
               : row.status === 'red' ? 'red'
               : row.status === 'yellow' ? 'yellow'
               : 'gray';
      statusMix[key] += 1;
    });
    const wlTotal = wins + losses;
    const rate = wlTotal ? Math.round((wins / wlTotal) * 100) : null;
    // count of days where total plays >= 12 (the quota)
    const { dayCount } = weekShape(week);
    let metDays = 0;
    for (let i = 0; i < dayCount; i++) {
      if (dayRollup(week, i).plays >= 12) metDays += 1;
    }
    return { plays, wins, losses, rate, statusMix, metDays, dayCount };
  }

  // helpers for navigating weeks
  function weekIndex(weekName) {
    return WEEK_NAMES.indexOf(weekName);
  }
  function prevWeek(weekName) {
    const i = weekIndex(weekName);
    return i > 0 ? WEEK_NAMES[i - 1] : null;
  }
  function nextWeek(weekName) {
    const i = weekIndex(weekName);
    return i >= 0 && i < WEEK_NAMES.length - 1 ? WEEK_NAMES[i + 1] : null;
  }

  window.RomangData = {
    DATA,
    WEEK_NAMES,
    LATEST: WEEK_NAMES[WEEK_NAMES.length - 1],
    parseWL,
    parseCount,
    weekShape,
    rowStats,
    dayRollup,
    weekRollup,
    buildPlayerIndex,
    weekIndex,
    prevWeek,
    nextWeek,
    STATUS_RANK,
  };
})();
