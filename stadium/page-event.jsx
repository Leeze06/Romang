// Page · 이벤트 — 6월 길랭 승점 이벤트 안내 + 실시간 점수판.
// 점수는 길랭표 데이터에서 이벤트 기간(6/8~6/21) 날짜만 골라 자동 집계.

(function () {
  const { useMemo } = React;
  const RD = window.RomangData;
  const S = window.Stadium;
  const { palette } = S;
  const EVENT = RD.EVENT;

  function EventPage() {
    const size = S.useResponsive();
    const mobile = size === 'mobile';
    const compact = size !== 'desktop';

    const scores = useMemo(() => RD.buildEventScores(), []);
    const hasData = scores.length > 0;

    return (
      <S.PageShell
        current="event" size={size}
        title={EVENT.title}
        subtitle={`${EVENT.period} · 2주간 · 승 ${EVENT.winPts}점 / 패 ${EVENT.lossPts}점`}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '360px minmax(0, 1fr)',
          gap: mobile ? 14 : 18,
          alignItems: 'start',
        }}>
          <RulesPanel mobile={mobile} />
          <ScoreBoard scores={scores} hasData={hasData} size={size} />
        </div>
      </S.PageShell>
    );
  }

  function RulesPanel({ mobile }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Rules card */}
        <div style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: palette.green, boxShadow: `0 0 8px ${palette.green}` }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: palette.text }}>이벤트 규칙</span>
          </div>
          <div style={{ padding: '6px 18px 14px' }}>
            <Rule n="1" title="기간">
              {EVENT.period} (오늘 ~ 일요일), 2주간 진행합니다.
            </Rule>
            <Rule n="2" title="승점제">
              길랭 <Em color={palette.red}>패 1점</Em> · <Em color={palette.green}>승 2점</Em>. 종료 후 총점
              <Em color={palette.cyan}> 1·2·3등</Em>에게 상품을 드립니다.
            </Rule>
            <Rule n="3" title="주간 적립 한도" last>
              점수는 <Em color={palette.text}>주 최대 7판</Em>까지 적립됩니다. 그 이상 돌릴 경우
              <Em color={palette.text}> 승리 점수가 우선</Em>됩니다.
              <div style={{
                marginTop: 8, padding: '8px 10px', borderRadius: 8,
                background: palette.bg, border: `1px dashed ${palette.line2}`,
                fontSize: 11, color: palette.dim, lineHeight: 1.5,
              }}>
                예) 한 주 10판 → 7승 3패라면 <b style={{ color: palette.text }}>7승만 적립 = 14점</b>
              </div>
            </Rule>
          </div>
        </div>

        {/* Prizes */}
        <div style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${palette.line}`, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: palette.text }}>상품</div>
          <div style={{ padding: 8 }}>
            {EVENT.prizes.map((p) => (
              <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
                <span style={{ fontSize: 20 }}>{p.medal}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: palette.label, width: 24 }}>{p.rank}등</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11, color: palette.label, lineHeight: 1.6, padding: '0 4px' }}>
          ※ 주 7일 길랭 · 5승 깜엽 지급은 별도로 계속 진행됩니다. 많은 참여 바랍니다.
        </div>
      </div>
    );
  }

  function Rule({ n, title, children, last }) {
    return (
      <div style={{
        display: 'flex', gap: 12, padding: '12px 0',
        borderBottom: last ? 'none' : `1px solid ${palette.line}`,
      }}>
        <span style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
          background: palette.cyanDim, color: palette.cyan,
          border: `1px solid ${palette.line2}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 12,
        }}>{n}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: palette.dim, lineHeight: 1.6 }}>{children}</div>
        </div>
      </div>
    );
  }
  function Em({ color, children }) {
    return <span style={{ color, fontWeight: 700 }}>{children}</span>;
  }

  // ---- Scoreboard --------------------------------------------------------

  function ScoreBoard({ scores, hasData, size }) {
    const mobile = size === 'mobile';
    return (
      <div style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: mobile ? '14px 16px' : '16px 20px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: mobile ? 15 : 17, fontWeight: 700, color: palette.text, fontFamily: 'Pretendard Variable, sans-serif' }}>실시간 점수판</span>
            {hasData && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: palette.greenSoft, color: palette.green, border: `1px solid ${palette.greenLine}`, fontWeight: 700, letterSpacing: 1 }}>LIVE</span>}
          </div>
          <div style={{ fontSize: 11, color: palette.label, fontFamily: 'JetBrains Mono, monospace' }}>{hasData ? `${scores.length}명 참여` : '집계 대기'}</div>
        </div>

        {!hasData ? <EmptyState mobile={mobile} /> : <ScoreList scores={scores} size={size} />}
      </div>
    );
  }

  function EmptyState({ mobile }) {
    return (
      <div style={{ padding: mobile ? '36px 20px' : '56px 24px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
          border: `2px dashed ${palette.line2}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, color: palette.dim,
        }}>⏱</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: palette.text, marginBottom: 6 }}>이벤트 집계 대기 중</div>
        <div style={{ fontSize: 12.5, color: palette.dim, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
          {RD.EVENT.period} 사이의 길랭표 기록이 입력되면
          <br />각자의 승점이 여기에 자동으로 순위별로 표시됩니다.
        </div>
        <div style={{ marginTop: 18, display: 'inline-flex', gap: 6, padding: '8px 14px', borderRadius: 8, background: palette.bg, border: `1px solid ${palette.line2}`, fontSize: 11, color: palette.label, fontFamily: 'JetBrains Mono, monospace' }}>
          승 {RD.EVENT.winPts}점 · 패 {RD.EVENT.lossPts}점 · 주 최대 {RD.EVENT.weeklyCap}판
        </div>
      </div>
    );
  }

  function ScoreList({ scores, size }) {
    const mobile = size === 'mobile';
    const maxScore = Math.max(...scores.map((s) => s.total), 1);
    return (
      <div style={{ padding: 6 }}>
        {/* column header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 14px', fontSize: 10, color: palette.label, textTransform: 'uppercase', letterSpacing: 1 }}>
          <span style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>#</span>
          <span style={{ flex: 1 }}>플레이어</span>
          {!mobile && EVENT.weeks.map((w) => (
            <span key={w.label} style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>{w.label}</span>
          ))}
          <span style={{ width: mobile ? 60 : 90, textAlign: 'right', flexShrink: 0 }}>총점</span>
        </div>

        {scores.map((p) => {
          const podium = p.rank <= 3;
          const medalColor = p.rank === 1 ? palette.green : p.rank === 2 ? palette.cyan : p.rank === 3 ? palette.yellow : palette.dim;
          return (
            <div key={p.nick} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: mobile ? '10px 12px' : '11px 14px',
              borderRadius: 10,
              background: podium ? `linear-gradient(90deg, ${hexA(medalColor, 0.10)}, transparent 60%)` : 'transparent',
              border: `1px solid ${podium ? hexA(medalColor, 0.25) : 'transparent'}`,
              marginBottom: 2,
            }}>
              <span style={{
                width: 28, height: 28, flexShrink: 0, borderRadius: 7,
                background: podium ? hexA(medalColor, 0.15) : 'transparent',
                border: `1px solid ${podium ? hexA(medalColor, 0.5) : palette.line2}`,
                color: podium ? medalColor : palette.dim,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 13,
              }}>{p.rank}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nick}</div>
                <div style={{ fontSize: 10.5, color: palette.label, marginTop: 1 }}>
                  {p.totalWins}승 {p.totalLosses}패 · {p.totalPlays}판{p.weeks.some((w) => w.capped) ? ' · 한도적용' : ''}
                </div>
              </div>

              {!mobile && p.weeks.map((w, i) => (
                <div key={i} style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
                  {w.plays > 0 ? (
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: palette.text }}>{w.score}</div>
                      <div style={{ fontSize: 9, color: palette.label }}>{w.scoredWins}승{w.scoredLosses}패{w.capped ? '·캡' : ''}</div>
                    </div>
                  ) : <span style={{ color: palette.label, opacity: 0.4 }}>·</span>}
                </div>
              ))}

              <div style={{ width: mobile ? 60 : 90, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontFamily: 'Pretendard Variable, sans-serif', fontSize: mobile ? 18 : 20, fontWeight: 800, color: podium ? medalColor : palette.text, letterSpacing: -0.5 }}>{p.total}</span>
                {!mobile && (
                  <div style={{ width: '100%', height: 4, background: palette.bg, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${(p.total / maxScore) * 100}%`, height: '100%', background: podium ? medalColor : palette.cyan }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // tiny hex+alpha helper for accent tints
  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<EventPage />);
})();
