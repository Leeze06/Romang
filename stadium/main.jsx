// Stadium · App entry. Wires header, stat row, table, sidebar, and the
// player-history modal together, and switches between desktop/tablet/mobile
// layouts.

(function () {
  const { useState, useMemo, useCallback } = React;
  const RD = window.RomangData;
  const S = window.Stadium;

  function App() {
    const size = S.useResponsive();
    const mobile = size === 'mobile';
    const tablet = size === 'tablet';
    const compact = mobile || tablet; // sidebar drops below table

    const [weekName, setWeekName] = useState(RD.LATEST);
    const [selectedNick, setSelectedNick] = useState(null);

    const week = RD.DATA[weekName];
    const shape = RD.weekShape(week);
    const rollup = useMemo(() => RD.weekRollup(week), [weekName]);

    const playerIndex = useMemo(() => RD.buildPlayerIndex(), []);
    const activePlayers = useMemo(() => Object.values(playerIndex).filter((p) => !p.left), [playerIndex]);
    const leftCount = useMemo(() => Object.values(playerIndex).filter((p) => p.left).length, [playerIndex]);

    const leaderboard = useMemo(() => {
      return activePlayers
        .filter((p) => (p.totals.wins + p.totals.losses) >= 14)
        .sort((a, b) => (b.totals.winRate ?? -1) - (a.totals.winRate ?? -1))
        .slice(0, 8);
    }, [activePlayers]);

    const consistency = useMemo(() => {
      return activePlayers
        .filter((p) => p.totals.weeksTotal >= 4)
        .map((p) => ({ ...p, greenRate: p.totals.weeksGreen / p.totals.weeksTotal }))
        .sort((a, b) => b.greenRate - a.greenRate || b.totals.weeksGreen - a.totals.weeksGreen)
        .slice(0, 6);
    }, [activePlayers]);

    const onPickPlayer = useCallback((nick) => setSelectedNick(nick), []);
    const onClose = useCallback(() => setSelectedNick(null), []);

    return (
      <div style={{
        minHeight: '100vh',
        background: S.palette.bg,
        color: S.palette.text,
        fontFamily: 'Inter, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
        padding: mobile ? 12 : tablet ? 18 : 24,
        backgroundImage: `radial-gradient(circle at 20% 0%, rgba(90,217,255,0.06), transparent 50%), radial-gradient(circle at 90% 100%, rgba(34,211,154,0.05), transparent 50%)`,
        boxSizing: 'border-box',
      }}>
        <Header weekName={weekName} setWeekName={setWeekName} size={size} />

        <StatRow week={week} rollup={rollup} shape={shape} size={size} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1fr) 280px',
          gap: mobile ? 10 : 14,
        }}>
          <S.Table week={week} shape={shape} size={size} onPickPlayer={onPickPlayer} />
          <S.Sidebar leaderboard={leaderboard} consistency={consistency} leftCount={leftCount} onPickPlayer={onPickPlayer} size={size} />
        </div>

        <Footer />

        <S.PlayerModal nick={selectedNick} playerIndex={playerIndex} onClose={onClose} size={size} />
      </div>
    );
  }

  function Header({ weekName, setWeekName, size }) {
    const mobile = size === 'mobile';
    return (
      <div style={{
        display: 'flex',
        flexDirection: mobile ? 'column' : 'row',
        alignItems: mobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        marginBottom: mobile ? 14 : 20,
        gap: mobile ? 10 : 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            fontFamily: 'Space Grotesk, Inter, sans-serif',
            fontSize: mobile ? 18 : 22, fontWeight: 800, letterSpacing: 3,
            color: S.palette.text,
          }}>
            <span style={{ color: S.palette.cyan }}>◆</span> ROMANG
          </div>
          <div style={{ fontSize: mobile ? 10 : 12, color: S.palette.dim, letterSpacing: 2, textTransform: 'uppercase' }}>Guild Battle Tracker</div>
        </div>
        <div style={{ display: 'flex', justifyContent: mobile ? 'flex-end' : 'flex-end' }}>
          <S.WeekSelector weekName={weekName} setWeekName={setWeekName} size={size} />
        </div>
      </div>
    );
  }

  function StatRow({ week, rollup, shape, size }) {
    const mobile = size === 'mobile';
    const tablet = size === 'tablet';
    const showWinRate = week.mode === 'wl';
    const cards = [
      <S.StatCard key="plays" mobile={mobile}
        label="Total Plays"
        value={rollup.plays}
        sub={week.mode === 'wl' ? `${rollup.wins}W · ${rollup.losses}L` : `${shape.dayCount}일 합산`}
        accent={S.palette.cyan} />,
      showWinRate && <S.StatCard key="rate" mobile={mobile}
        label="Win Rate"
        value={rollup.rate != null ? `${rollup.rate}%` : '—'}
        sub={`${rollup.wins} wins / ${rollup.wins + rollup.losses}`}
        accent={S.palette.green} />,
      <S.StatCard key="quota" mobile={mobile}
        label="Quota Met (12+)"
        value={`${rollup.metDays}/${rollup.dayCount}`}
        sub={rollup.metDays === rollup.dayCount ? '전일 충족' : `${rollup.dayCount - rollup.metDays}일 미달`}
        accent={rollup.metDays === rollup.dayCount ? S.palette.green : S.palette.yellow} />,
      <S.StatCard key="roster" mobile={mobile}
        label="Active Roster"
        value={rollup.statusMix.green + rollup.statusMix.yellow + rollup.statusMix.red}
        sub={`녹 ${rollup.statusMix.green} · 노 ${rollup.statusMix.yellow} · 적 ${rollup.statusMix.red} · 회 ${rollup.statusMix.gray}`}
        accent={S.palette.cyan} />,
    ].filter(Boolean);

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : tablet ? 'repeat(2, 1fr)' : `repeat(${cards.length}, 1fr)`,
        gap: mobile ? 8 : 12,
        marginBottom: mobile ? 12 : 18,
      }}>
        {cards}
      </div>
    );
  }

  function Footer() {
    return (
      <div style={{
        marginTop: 18,
        padding: '12px 0',
        textAlign: 'center',
        fontSize: 10,
        color: S.palette.label,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        Romang Guild Battle Tracker · {RD.WEEK_NAMES.length}주 누적
      </div>
    );
  }

  // Mount
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
