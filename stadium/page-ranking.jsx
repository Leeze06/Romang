// Page · 랭킹 — cumulative win-rate leaderboard (누적 승률 TOP).
// Excludes players who left the guild. Rows open the player history modal.

(function () {
  const { useState, useMemo, useCallback } = React;
  const RD = window.RomangData;
  const S = window.Stadium;
  const { palette } = S;

  function RankingPage() {
    const size = S.useResponsive();
    const mobile = size === 'mobile';
    const compact = size !== 'desktop';

    const [season, setSeason] = useState(RD.DEFAULT_SEASON);
    const seasonWeeks = RD.seasonWeeks(season);
    const minPlays = seasonWeeks.length <= 3 ? 3 : 14;

    const playerIndex = useMemo(() => RD.buildPlayerIndex(seasonWeeks), [season]);
    const active = useMemo(() => Object.values(playerIndex).filter((p) => !p.left), [playerIndex]);
    const leftCount = useMemo(() => Object.values(playerIndex).filter((p) => p.left).length, [playerIndex]);

    const winrate = useMemo(() => active
      .filter((p) => (p.totals.wins + p.totals.losses) >= minPlays)
      .sort((a, b) => (b.totals.winRate ?? -1) - (a.totals.winRate ?? -1) || (b.totals.wins + b.totals.losses) - (a.totals.wins + a.totals.losses))
      .slice(0, 20), [active, minPlays]);

    return (
      <S.PageShell
        current="ranking" size={size}
        title="랭킹"
        subtitle={`${season} 누적 승률 · ${seasonWeeks.length}주 기록`}
        right={<S.SeasonToggle season={season} setSeason={setSeason} size={size} />}
      >
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <Board
            title={`${season} 누적 승률 TOP`}
            hint={`${minPlays}판 이상 · 현역만`}
            metricLabel="승률"
            rows={winrate}
            render={(p) => ({
              primary: `${p.totals.winRate}%`,
              sub: `${p.totals.wins}승 ${p.totals.losses}패 · ${p.totals.wins + p.totals.losses}판`,
              bar: (p.totals.winRate || 0) / 100,
            })}
            size={size}
            emptyNote={seasonWeeks.length <= 3 ? `${season}은 아직 집계 초기입니다. 길랭 기록이 쌓이면 순위가 채워집니다.` : null}
          />
        </div>
      </S.PageShell>
    );
  }

  function Board({ title, hint, metricLabel, rows, render, size, emptyNote }) {
    const mobile = size === 'mobile';
    const top3 = rows.slice(0, 3);
    const rest = rows.slice(3);
    return (
      <div style={{
        background: palette.panel,
        border: `1px solid ${palette.line}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        <div style={{ padding: mobile ? '14px 16px' : '16px 20px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: mobile ? 15 : 17, fontWeight: 700, letterSpacing: 0.3, color: palette.text, fontFamily: 'Pretendard Variable, sans-serif' }}>{title}</div>
          <div style={{ fontSize: 11, color: palette.label }}>{hint}</div>
        </div>

        {/* Podium for top 3 — crown + laurel medals */}
        {top3.length > 0 && (
          <div style={{ padding: mobile ? '16px 14px 8px' : '24px 20px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: mobile ? 8 : 14, alignItems: 'end' }}>
            {top3.map((p, i) => {
              const r = render(p);
              const medal = ['assets/rank1.png', 'assets/rank2.png', 'assets/rank3.png'][i];
              // gold / silver / bronze tints for the metric text
              const medalColor = i === 0 ? '#f1c75c' : i === 1 ? '#cdd6e3' : '#d59a6c';
              const medalSize = i === 0 ? (mobile ? 92 : 124) : (mobile ? 74 : 102);
              return (
                <div key={p.nick} className="sd-podium" style={{
                  background: palette.bg, border: `1px solid ${palette.line2}`, borderRadius: 14,
                  padding: mobile ? '12px 6px 14px' : '16px 10px 18px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mobile ? 5 : 7,
                  textAlign: 'center', color: 'inherit', font: 'inherit',
                  transform: i === 0 ? 'translateY(-6px)' : 'none',
                  boxShadow: i === 0 ? `0 10px 30px ${medalColor}22` : 'none',
                }}>
                  <img src={medal} alt={`${i + 1}위`} style={{
                    width: medalSize, height: medalSize, objectFit: 'contain', display: 'block',
                    filter: `drop-shadow(0 4px 12px ${medalColor}3a)`,
                  }} />
                  <div style={{ fontSize: mobile ? 12 : 14, fontWeight: 700, color: palette.text, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nick}</div>
                  <div style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: mobile ? 19 : 24, fontWeight: 800, color: medalColor, letterSpacing: -0.5, lineHeight: 1 }}>{r.primary}</div>
                  <div style={{ fontSize: 10.5, color: palette.dim }}>{r.sub}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Remaining ranks */}
        <div style={{ padding: 6 }}>
          {rest.map((p, i) => {
            const r = render(p);
            const rank = i + 4;
            return (
              <div key={p.nick} className="sd-rankrow" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: 'transparent', border: 'none',
                color: 'inherit', font: 'inherit', textAlign: 'left',
              }}>
                <span style={{ width: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: palette.label, textAlign: 'center', flexShrink: 0 }}>{rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nick}</div>
                  <div style={{ fontSize: 10, color: palette.label }}>{r.sub}</div>
                </div>
                <div style={{ width: mobile ? 56 : 80, height: 5, background: palette.bg, borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ width: `${Math.min(1, r.bar) * 100}%`, height: '100%', background: palette.cyan }} />
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: palette.text, minWidth: 46, textAlign: 'right' }}>{r.primary}</span>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: palette.dim, fontSize: 12, lineHeight: 1.6 }}>{emptyNote || '표시할 데이터가 없습니다.'}</div>
          )}
        </div>

      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<RankingPage />);
})();
