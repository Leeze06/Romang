// Shared utilities — parses WEEKLY_DATA and computes per-player aggregates.
// Exposed on window for sibling Babel scripts.

(function () {
  const DATA = window.WEEKLY_DATA || {};
  const WEEK_NAMES = Object.keys(DATA);

  // ---- Seasons -----------------------------------------------------------
  // 시즌 17: '1월 3주차' ~ '6월 4주차'.  시즌 18: '7월 3주차' 부터.
  const SEASON_BOUNDARY = '7월 3주차'; // 18시즌 첫 주차
  function seasonOf(weekName) {
    const i = WEEK_NAMES.indexOf(weekName);
    const b = WEEK_NAMES.indexOf(SEASON_BOUNDARY);
    return (b >= 0 && i >= b) ? 'S18' : 'S17';
  }
  // S18 먼저(기본), S17 다음.
  const SEASONS = [
    { id: 'S18', label: 'S18', full: '시즌 18', weeks: WEEK_NAMES.filter((w) => seasonOf(w) === 'S18') },
    { id: 'S17', label: 'S17', full: '시즌 17', weeks: WEEK_NAMES.filter((w) => seasonOf(w) === 'S17') },
  ].filter((s) => s.weeks.length > 0);
  const DEFAULT_SEASON = SEASONS[0] ? SEASONS[0].id : 'S18';
  function seasonWeeks(id) { const s = SEASONS.find((x) => x.id === id); return s ? s.weeks : WEEK_NAMES; }

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

  // Cumulative per-player stats across a set of weeks (defaults to all).
  // Pass a season's week list to compute season-scoped rankings.
  function buildPlayerIndex(weekNames) {
    const names = (weekNames && weekNames.length) ? weekNames : WEEK_NAMES;
    const index = {}; // nick -> { weeks: [{weekName, status, ...stats}], totals: {...} }
    const latestWeekName = names[names.length - 1];
    const latestNicks = new Set((DATA[latestWeekName]?.rows || []).map((r) => r.before[0]));

    names.forEach((weekName) => {
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

  // ---- Event scoring -----------------------------------------------------
  // "S18 길랭 승점 이벤트": 7/13 ~ 8/3, 3주.
  // 승 2점 · 패 1점. 주 최대 7판까지만 적립, 초과 시 승리 우선.
  //   ex) 한 주 10판(7승 3패) → 7승만 적립 = 14점
  const EVENT = {
    title: 'S18 길랭 승점 이벤트',
    period: '7월 13일 ~ 8월 3일',
    start: { month: 7, day: 13 },
    end: { month: 8, day: 3 },
    weeklyCap: 7,
    winPts: 2,
    lossPts: 1,
    weeks: [
      { label: '1주차', range: '7/13–7/19', start: { month: 7, day: 13 }, end: { month: 7, day: 19 } },
      { label: '2주차', range: '7/20–7/26', start: { month: 7, day: 20 }, end: { month: 7, day: 26 } },
      { label: '3주차', range: '7/27–8/3', start: { month: 7, day: 27 }, end: { month: 8, day: 3 } },
    ],
    prizes: [
      { rank: 1, medal: '🥇', label: '치킨 기프티콘' },
      { rank: 2, medal: '🥈', label: '편의점 15,000원 쿠폰' },
      { rank: 3, medal: '🥉', label: '베스킨라빈스 파인트' },
    ],
  };

  function parseDayCol(col) {
    const m = String(col).match(/(\d+)\s*월\s*(\d+)\s*일/);
    if (!m) return null;
    return { month: +m[1], day: +m[2] };
  }
  function dateOrd(month, day) { return month * 100 + day; }

  // Returns per-player event scores, sorted (excludes players who left).
  //   asOfOrd: when given, only counts plays dated on/before this ordinal
  //            (used for the staged 6/14 → 6/21 reveals).
  function buildEventScores(asOfOrd) {
    const playerIndex = buildPlayerIndex();
    const cap = EVENT.weeklyCap;
    const acc = {}; // nick -> { nick, weeks: [{wins,losses}, ...] }
    const ensure = (nick) => {
      if (!acc[nick]) acc[nick] = { nick, weeks: EVENT.weeks.map(() => ({ wins: 0, losses: 0 })) };
      return acc[nick];
    };

    WEEK_NAMES.forEach((wn) => {
      const week = DATA[wn];
      if (week.mode !== 'wl') return;
      const { dayCols } = weekShape(week);
      dayCols.forEach((col, di) => {
        const date = parseDayCol(col);
        if (!date) return;
        const ord = dateOrd(date.month, date.day);
        if (asOfOrd != null && ord > asOfOrd) return; // not yet revealed
        const ewi = EVENT.weeks.findIndex((w) =>
          ord >= dateOrd(w.start.month, w.start.day) && ord <= dateOrd(w.end.month, w.end.day));
        if (ewi < 0) return; // outside event window
        week.rows.forEach((row) => {
          const nick = row.before[0];
          if (!nick) return;
          const r = parseWL(row.before[1 + di]);
          if (r.plays === 0) return;
          const a = ensure(nick);
          a.weeks[ewi].wins += r.wins;
          a.weeks[ewi].losses += r.losses;
        });
      });
    });

    const results = Object.values(acc).map((p) => {
      const weeks = p.weeks.map((w) => {
        const scoredWins = Math.min(w.wins, cap);
        const remaining = Math.max(0, cap - scoredWins);
        const scoredLosses = Math.min(w.losses, remaining);
        const score = scoredWins * EVENT.winPts + scoredLosses * EVENT.lossPts;
        const plays = w.wins + w.losses;
        return { wins: w.wins, losses: w.losses, scoredWins, scoredLosses, score, plays, capped: plays > cap };
      });
      const total = weeks.reduce((s, w) => s + w.score, 0);
      const totalPlays = weeks.reduce((s, w) => s + w.plays, 0);
      const totalWins = weeks.reduce((s, w) => s + w.wins, 0);
      const totalLosses = weeks.reduce((s, w) => s + w.losses, 0);
      const left = playerIndex[p.nick] ? playerIndex[p.nick].left : false;
      return { nick: p.nick, weeks, total, totalPlays, totalWins, totalLosses, left };
    })
      .filter((p) => p.totalPlays > 0 && !p.left)
      .sort((a, b) => b.total - a.total || b.totalPlays - a.totalPlays || a.nick.localeCompare(b.nick));

    // assign dense ranks (ties share a rank)
    let lastScore = null, lastRank = 0;
    results.forEach((p, i) => {
      if (p.total !== lastScore) { lastRank = i + 1; lastScore = p.total; }
      p.rank = lastRank;
    });
    return results;
  }

  // ---- Staged reveal -----------------------------------------------------
  // The scoreboard is NOT shown live. It is revealed in two snapshots so a
  // bad early run doesn't kill motivation:
  //   stage 0 = 대기중 (집계 전)
  //   stage 1 = 1주차(6/14)까지의 데이터로 산정한 점수판 — 6/14~6/20 동안 고정
  //   stage 2 = 6/21까지의 데이터로 산정한 최종 점수판
  // A stage unlocks only when BOTH: today has reached that week's end date,
  // AND that week's 길랭표 데이터가 실제로 집계(입력)되어 있을 때.
  function todayOrd() {
    const d = new Date();
    return dateOrd(d.getMonth() + 1, d.getDate());
  }

  // Any recorded play within [w.start, w.end]?  (= 해당 주차 데이터가 들어왔는가)
  function weekHasData(w) {
    const s = dateOrd(w.start.month, w.start.day);
    const e = dateOrd(w.end.month, w.end.day);
    return WEEK_NAMES.some((wn) => {
      const week = DATA[wn];
      if (week.mode !== 'wl') return false;
      const { dayCols } = weekShape(week);
      return dayCols.some((col, di) => {
        const date = parseDayCol(col);
        if (!date) return false;
        const ord = dateOrd(date.month, date.day);
        if (ord < s || ord > e) return false;
        return week.rows.some((r) => parseWL(r.before[1 + di]).plays > 0);
      });
    });
  }

  function eventStage() {
    // manual override for preview/QA:  event.html?eventStage=0|1|2
    try {
      const q = new URLSearchParams(location.search).get('eventStage');
      if (q != null && q !== '') return Math.max(0, Math.min(EVENT.weeks.length, parseInt(q, 10) || 0));
    } catch (e) { /* no location */ }
    const today = todayOrd();
    let stage = 0;
    EVENT.weeks.forEach((w, i) => {
      const endOrd = dateOrd(w.end.month, w.end.day);
      if (today >= endOrd && weekHasData(w)) stage = i + 1;
    });
    return stage;
  }

  // One call for the page: returns the active snapshot.
  function eventBoard() {
    const stage = eventStage();
    if (stage === 0) return { stage: 0, scores: [], final: false, asOfLabel: null, visibleWeeks: 0 };
    const w = EVENT.weeks[stage - 1];
    const cutoffOrd = dateOrd(w.end.month, w.end.day);
    return {
      stage,
      scores: buildEventScores(cutoffOrd),
      final: stage === EVENT.weeks.length,
      asOfLabel: `${w.end.month}/${w.end.day}`,
      visibleWeeks: stage,
    };
  }

  window.RomangData = {
    DATA,
    WEEK_NAMES,
    LATEST: WEEK_NAMES[WEEK_NAMES.length - 1],
    SEASONS,
    DEFAULT_SEASON,
    seasonOf,
    seasonWeeks,
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
    EVENT,
    parseDayCol,
    buildEventScores,
    eventStage,
    eventBoard,
  };
})();
