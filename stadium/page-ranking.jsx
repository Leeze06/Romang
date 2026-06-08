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

    const [selectedNick, setSelectedNick] = useState(null);
    const onPick = useCallback((nick) => setSelectedNick(nick), []);
    const onClose = useCallback(() => setSelectedNick(null), []);

    const playerIndex = useMemo(() => RD.buildPlayerIndex(), []);
    const active = useMemo(() => Object.values(playerIndex).filter((p) => !p.left), [playerIndex]);
    const leftCount = useMemo(() => Object.values(playerIndex).filter((p) => p.left).length, [playerIndex]);

    const winrate = useMemo(() => active
      .filter((p) => (p.totals.wins + p.totals.losses) >= 14)
      .sort((a, b) => (b.totals.winRate ?? -1) - (a.totals.winRate ?? -1) || (b.totals.wins + b.totals.losses) - (a.totals.wins + a.totals.losses))
      .slice(0, 20), [active]);

    return (
      <S.PageShell
        current="ranking" size={size}
        title="랭킹"
        subtitle={`전체 ${RD.WEEK_NAMES.length}주 누적 · 현역 길드원만 · 탈퇴자 ${leftCount}명 제외`}
      >
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <Board
            title="누적 승률 TOP"
            hint="14판 이상"
            metricLabel="승률"
            rows={winrate}
            render={(p) => ({
              primary: `${p.totals.winRate}%`,
              sub: `${p.totals.wins}승 ${p.totals.losses}패 · ${p.totals.wins + p.totals.losses}판`,
              bar: (p.totals.winRate || 0) / 100,
            })}
            onPick={onPick} size={size}
          />
        </div>

        <S.PlayerModal nick={selectedNick} playerIndex={playerIndex} onClose={onClose} size={size} />
      </S.PageShell>
    );
  }

  function Board({ title, hint, metricLabel, rows, render, onPick, size }) {
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
          <div style={{ fontSize: mobile ? 15 : 17, fontWeight: 700, letterSpacing: 0.3, color: palette.text, fontFamily: 'Space Grotesk, Inter, sans-serif' }}>{title}</div>
          <div style={{ fontSize: 11, color: palette.label }}>{hint}</div>
        </div>

        {/* Podium for top 3 */}
        {top3.length > 0 && (
          <div style={{ padding: mobile ? '14px 16px 6px' : '18px 20px 8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {top3.map((p, i) => {
              const r = render(p);
              const medalColor = i === 0 ? palette.green : i === 1 ? palette.cyan : palette.yellow;
              return (
                <button key={p.nick} onClick={() => onPick(p.nick)} className="sd-podium" style={{
                  background: palette.bg, border: `1px solid ${palette.line2}`, borderRadius: 12,
                  padding: mobile ? '12px 8px' : '16px 12px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  textAlign: 'center', color: 'inherit', font: 'inherit',
                  transform: i === 0 ? 'translateY(-4px)' : 'none',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    border: `2px solid ${medalColor}`, color: medalColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 14,
                    boxShadow: i === 0 ? `0 0 12px ${medalColor}55` : 'none',
                  }}>{i + 1}</div>
                  <div style={{ fontSize: mobile ? 12 : 13, fontWeight: 700, color: palette.text, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nick}</div>
                  <div style={{ fontFamily: 'Space Grotesk, monospace', fontSize: mobile ? 18 : 22, fontWeight: 800, color: medalColor, letterSpacing: -0.5 }}>{r.primary}</div>
                  <div style={{ fontSize: 10, color: palette.dim }}>{metricLabel}</div>
                </button>
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
              <button key={p.nick} onClick={() => onPick(p.nick)} className="sd-rankrow" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
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
              </button>
            );
          })}
          {rows.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: palette.dim, fontSize: 12 }}>표시할 데이터가 없습니다.</div>
          )}
        </div>
        <style>{`.sd-rankrow:hover, .sd-podium:hover { background: rgba(120,180,255,0.05); }`}</style>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<RankingPage />);
})();
