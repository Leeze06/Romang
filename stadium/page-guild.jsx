// Page · 길랭표 — full-width roster table with filters (no Active Roster card,
// no sidebar; rankings live on the 랭킹 page).

(function () {
  const { useState, useMemo, useCallback } = React;
  const RD = window.RomangData;
  const S = window.Stadium;

  function GuildPage() {
    const size = S.useResponsive();
    const mobile = size === 'mobile';
    const tablet = size === 'tablet';

    const [weekName, setWeekName] = useState(RD.LATEST);
    const [selectedNick, setSelectedNick] = useState(null);

    const week = RD.DATA[weekName];
    const shape = RD.weekShape(week);
    const rollup = useMemo(() => RD.weekRollup(week), [weekName]);
    const playerIndex = useMemo(() => RD.buildPlayerIndex(), []);

    const onPick = useCallback((nick) => setSelectedNick(nick), []);
    const onClose = useCallback(() => setSelectedNick(null), []);

    const cards = [
      <S.StatCard key="plays" mobile={mobile}
        label="Total Plays" value={rollup.plays}
        sub={week.mode === 'wl' ? `${rollup.wins}W · ${rollup.losses}L` : `${shape.dayCount}일 합산`}
        accent={S.palette.cyan} />,
      week.mode === 'wl' && <S.StatCard key="rate" mobile={mobile}
        label="Win Rate" value={rollup.rate != null ? `${rollup.rate}%` : '—'}
        sub={`${rollup.wins} wins / ${rollup.wins + rollup.losses}`}
        accent={S.palette.green} />,
      <S.StatCard key="quota" mobile={mobile}
        label="Quota Met (12+)" value={`${rollup.metDays}/${rollup.dayCount}`}
        sub={rollup.metDays === rollup.dayCount ? '전일 충족' : `${rollup.dayCount - rollup.metDays}일 미달`}
        accent={rollup.metDays === rollup.dayCount ? S.palette.green : S.palette.yellow} />,
    ].filter(Boolean);

    return (
      <S.PageShell
        current="guild" size={size}
        title="길랭표"
        subtitle={`주차별 길드전 기록 · 닉네임을 누르면 개인 전적이 열립니다`}
        right={<S.WeekSelector weekName={weekName} setWeekName={setWeekName} size={size} />}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : tablet ? 'repeat(3, 1fr)' : `repeat(${cards.length}, 1fr)`,
          gap: mobile ? 8 : 12,
          marginBottom: mobile ? 12 : 18,
        }}>
          {cards}
        </div>

        <S.Table week={week} shape={shape} size={size} onPickPlayer={onPick} />

        <S.PlayerModal nick={selectedNick} playerIndex={playerIndex} onClose={onClose} size={size} />
      </S.PageShell>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<GuildPage />);
})();
