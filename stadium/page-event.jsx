// Page · 이벤트 — S18 길랭 승점 이벤트 안내 + 점수판.
// 점수는 길랭표 데이터에서 이벤트 기간(7/13~8/2) 날짜만 골라 자동 집계.

(function () {
  const { useMemo } = React;
  const RD = window.RomangData;
  const S = window.Stadium;
  const { palette } = S;
  const EVENT = RD.EVENT;
  const REVEAL_LABELS = EVENT.weeks.map((w) => `${w.end.month}/${w.end.day}`);

  function EventPage() {
    const size = S.useResponsive();
    const mobile = size === 'mobile';
    const compact = size !== 'desktop';

    const board = useMemo(() => RD.eventBoard(), []);

    return (
      <S.PageShell
        current="event" size={size}
        title={EVENT.title}
        subtitle={<>{EVENT.period}, {EVENT.weeks.length}주간 진행<br />승리 시: {EVENT.winPts}점 / 패배 시: {EVENT.lossPts}점</>}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '360px minmax(0, 1fr)',
          gap: mobile ? 14 : 18,
          alignItems: 'start',
        }}>
          <RulesPanel mobile={mobile} />
          <ScoreBoard board={board} size={size} />
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
              {EVENT.period} (오늘 ~ 일요일), {EVENT.weeks.length}주간 진행합니다. 이전과 규칙은 같지만 기간을 늘려서 진행합니다.
            </Rule>
            <Rule n="2" title="승점제">
              길랭 <Em color={palette.red}>패배 시 1점,</Em> <Em color={palette.green}>승리 시 2점</Em>. 종료 후 총점
              <Em color={palette.cyan}> 1·2·3등</Em>에게 순위에 따라 상품을 드립니다.
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
            <div style={{
              margin: '4px 4px 2px', padding: '10px 12px', borderRadius: 10,
              background: 'linear-gradient(90deg, rgba(28,58,110,0.08), rgba(217,178,90,0.10))',
              border: `1px solid ${palette.line2}`,
              fontSize: 11.5, color: palette.dim, lineHeight: 1.55,
            }}>
              수상자가 원하면 <b style={{ color: palette.text }}>동일 금액대의 다른 상품</b>으로 변경 가능해요. (예: 베라 파인트 등)
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: palette.label, lineHeight: 1.6, padding: '0 4px' }}>
          ※ 주 7일 길랭 · 5승 깜엽 지급은 별도로 계속 진행됩니다. 많이 지더라도 판수박치기로 2등 한 사례도 있었으니 길랭 많이 참여해 주세요!
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

  function ScoreBoard({ board, size }) {
    const mobile = size === 'mobile';
    const { stage, scores, final, asOfLabel, visibleWeeks } = board;
    const hasData = stage > 0;
    return (
      <div style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: mobile ? '14px 16px' : '16px 20px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: mobile ? 15 : 17, fontWeight: 700, color: palette.text, fontFamily: 'Pretendard Variable, sans-serif' }}>점수판</span>
            {hasData && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: 1,
                background: final ? palette.cyanDim : palette.greenSoft,
                color: final ? palette.cyan : palette.green,
                border: `1px solid ${final ? palette.line2 : palette.greenLine}`,
              }}>{final ? '최종 확정' : '1차 집계'}</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: palette.label, fontFamily: 'JetBrains Mono, monospace' }}>
            {hasData ? `${asOfLabel} 기준 · ${scores.length}명` : '집계 중'}
          </div>
        </div>

        {!hasData ? <EmptyState mobile={mobile} /> : <ScoreList scores={scores} visibleWeeks={visibleWeeks} final={final} size={size} />}
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
        <div style={{ fontSize: 15, fontWeight: 700, color: palette.text, marginBottom: 6 }}>점수판 공개 대기 중</div>
        <div style={{ fontSize: 12.5, color: palette.dim, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
          점수판은 각 주차가 끝날 때마다 공개됩니다.
          <br /><b style={{ color: palette.text }}>{REVEAL_LABELS[0]},</b> <b style={{ color: palette.text }}>{REVEAL_LABELS[1]}</b> 집계가 끝나면 중간 순위가,
          <br /><b style={{ color: palette.text }}>{REVEAL_LABELS[REVEAL_LABELS.length - 1]}</b> 전체 집계가 끝나면 최종 순위가 공개돼요.
        </div>
      </div>
    );
  }

  function ScoreList({ scores, visibleWeeks, final, size }) {
    const mobile = size === 'mobile';
    const maxScore = Math.max(...scores.map((s) => s.total), 1);
    const weeks = EVENT.weeks.slice(0, visibleWeeks);
    return (
      <div style={{ padding: 6 }}>
        {!final && (
          <div style={{ margin: '6px 8px 2px', padding: '8px 12px', borderRadius: 8, background: palette.cyanDim, border: `1px solid ${palette.line2}`, fontSize: 11.5, color: palette.dim, lineHeight: 1.5 }}>
            현재 <b style={{ color: palette.text }}>{REVEAL_LABELS[visibleWeeks - 1]}</b> 기준 중간 순위입니다. 남은 주차 결과가 반영된 <b style={{ color: palette.text }}>최종 순위는 {REVEAL_LABELS[REVEAL_LABELS.length - 1]}</b>에 공개됩니다.
          </div>
        )}
        {/* column header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 14px', fontSize: 10, color: palette.label, textTransform: 'uppercase', letterSpacing: 1 }}>
          <span style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>#</span>
          <span style={{ flex: 1 }}>플레이어</span>
          {!mobile && weeks.map((w) => (
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

              {!mobile && p.weeks.slice(0, visibleWeeks).map((w, i) => (
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
