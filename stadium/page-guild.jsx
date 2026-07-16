// Page · 길랭표 — full-width roster table with filters (no Active Roster card,
// no sidebar; rankings live on the 랭킹 page).

(function () {
  const { useState, useMemo, useCallback, useRef, useEffect } = React;
  const RD = window.RomangData;
  const S = window.Stadium;
  const Auth = window.RomangAuth;

  function GuildPage() {
    const size = S.useResponsive();
    const mobile = size === 'mobile';
    const tablet = size === 'tablet';

    const [season, setSeason] = useState(RD.DEFAULT_SEASON);
    const seasonWeeks = RD.seasonWeeks(season);
    const [weekName, setWeekName] = useState(seasonWeeks[seasonWeeks.length - 1]);
    const [selectedNick, setSelectedNick] = useState(null);

    // When season changes, jump to that season's latest week.
    const onSeason = useCallback((id) => {
      setSeason(id);
      const ws = RD.seasonWeeks(id);
      setWeekName(ws[ws.length - 1]);
    }, []);

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
        subtitle={<ul style={{ margin: 0, paddingLeft: 18 }}><li>주차별로 길랭 판수 기록</li><li>닉네임 눌러서 개인 전적만 확인 가능</li></ul>}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 8 : 10, flexWrap: 'wrap', justifyContent: mobile ? 'flex-start' : 'flex-end' }}>
            <S.SeasonToggle season={season} setSeason={onSeason} size={size} />
            <S.WeekSelector weekName={weekName} setWeekName={setWeekName} size={size} weeks={seasonWeeks} />
          </div>
        }
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

  function LockScreen({ onUnlock }) {
    const P = S.palette;
    const [pw, setPw] = useState('');
    const [err, setErr] = useState(false);
    const [busy, setBusy] = useState(false);
    const inputRef = useRef(null);
    useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

    const submit = async (e) => {
      if (e) e.preventDefault();
      if (busy) return;
      setBusy(true);
      const ok = await Auth.verify(pw);
      setBusy(false);
      if (ok) { Auth.setAuthed(); onUnlock(); }
      else { setErr(true); setPw(''); if (inputRef.current) inputRef.current.focus(); }
    };

    return (
      <div style={{
        minHeight: '100vh', background: P.bg, color: P.text,
        fontFamily: 'Pretendard Variable, "Apple SD Gothic Neo", sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(90,217,255,0.06), transparent 50%), radial-gradient(circle at 90% 100%, rgba(34,211,154,0.05), transparent 50%)',
      }}>
        <form onSubmit={submit} style={{
          width: '100%', maxWidth: 360,
          background: P.panel, border: `1px solid ${P.line}`, borderRadius: 16,
          padding: '32px 26px', textAlign: 'center',
          boxShadow: '0 20px 50px rgba(18,33,63,0.14)',
        }}>
          <img src="assets/romang-emblem.png" alt="Romang" style={{ height: 64, marginBottom: 14, filter: 'drop-shadow(0 4px 12px rgba(18,33,63,0.28))' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={P.cyan} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: P.text, fontFamily: 'Pretendard Variable, sans-serif' }}>길랭표 잠금</h1>
          </div>
          <div style={{ fontSize: 12.5, color: P.dim, marginBottom: 20, lineHeight: 1.5 }}>관리자 전용 페이지입니다.<br />비밀번호를 입력해 주세요.</div>

          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            placeholder="비밀번호"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px', borderRadius: 10,
              background: P.bg, color: P.text,
              border: `1px solid ${err ? P.red : P.line2}`,
              fontSize: 16, textAlign: 'center', letterSpacing: 4,
              fontFamily: 'JetBrains Mono, monospace',
              outline: 'none',
            }}
          />
          {err && <div style={{ marginTop: 10, fontSize: 12, color: P.red, fontWeight: 600 }}>비밀번호가 올바르지 않습니다.</div>}

          <button type="submit" disabled={busy || !pw} style={{
            marginTop: 18, width: '100%',
            padding: '12px 14px', borderRadius: 10, border: 'none',
            background: (busy || !pw) ? 'rgba(28,58,110,0.25)' : palette.navy,
            color: palette.goldSoft, fontSize: 15, fontWeight: 800, cursor: (busy || !pw) ? 'default' : 'pointer',
            fontFamily: 'Pretendard Variable, sans-serif',
            transition: 'opacity .15s',
          }}>{busy ? '확인 중…' : '입장'}</button>

          <a href="index.html" style={{ display: 'inline-block', marginTop: 16, fontSize: 12, color: P.label, textDecoration: 'none' }}>← 메뉴로 돌아가기</a>
        </form>
      </div>
    );
  }

  function Root() {
    const [authed, setAuthed] = useState(() => Auth.isAuthed());
    if (!authed) return <LockScreen onUnlock={() => setAuthed(true)} />;
    return <GuildPage />;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
})();
