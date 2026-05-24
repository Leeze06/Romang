// Stadium · Player history modal (per-nickname career view).

(function () {
  const { useEffect, useMemo } = React;
  const RD = window.RomangData;
  const { palette, statusColor, WLChips } = window.Stadium;

  function PlayerModal({ nick, playerIndex, onClose, size }) {
    const player = nick ? playerIndex[nick] : null;
    const mobile = size === 'mobile';

    // Lock scroll while modal is open + escape to close.
    useEffect(() => {
      if (!nick) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', onKey);
      };
    }, [nick, onClose]);

    // Build per-week timeline for the player.
    const timeline = useMemo(() => {
      if (!player) return [];
      const byWeek = new Map(player.weeks.map((w) => [w.weekName, w]));
      // Include all guild weeks so absent weeks render as gaps.
      return RD.WEEK_NAMES.map((wn) => byWeek.get(wn) || { weekName: wn, absent: true });
    }, [player]);

    if (!nick) return null;

    if (!player) {
      // unknown — should never happen but be defensive
      return (
        <Backdrop onClose={onClose}>
          <Sheet mobile={mobile} onClose={onClose}>
            <div style={{ padding: 40, color: palette.dim, textAlign: 'center' }}>플레이어 정보를 찾을 수 없습니다.</div>
          </Sheet>
        </Backdrop>
      );
    }

    const t = player.totals;
    const wlTotal = t.wins + t.losses;
    const greenRate = t.weeksTotal ? Math.round((t.weeksGreen / t.weeksTotal) * 100) : 0;
    const lastWeekEntry = player.weeks[player.weeks.length - 1];
    const lastStatus = lastWeekEntry ? statusColor[lastWeekEntry.status] || statusColor.gray : null;

    return (
      <Backdrop onClose={onClose}>
        <Sheet mobile={mobile} onClose={onClose}>
          {/* Header */}
          <div style={{
            padding: mobile ? '18px 18px 14px' : '22px 28px 18px',
            borderBottom: `1px solid ${palette.line}`,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: palette.label, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Operator Dossier</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: mobile ? 22 : 28, fontWeight: 800, color: palette.text, fontFamily: 'Space Grotesk, Inter, sans-serif', letterSpacing: -0.5 }}>{player.nick}</h2>
                {player.left ? (
                  <Pill color={palette.gray} bg="rgba(93,108,135,0.15)" border="rgba(93,108,135,0.4)">탈퇴</Pill>
                ) : lastStatus ? (
                  <Pill color={lastStatus.fg} bg={lastStatus.bg} border={lastStatus.line}>최근 {lastStatus.label}</Pill>
                ) : null}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: palette.dim }}>
                {player.weeks[0]?.weekName} → {player.weeks[player.weeks.length - 1]?.weekName} · {t.weeksTotal}주 기록
              </div>
            </div>
            <button onClick={onClose} style={closeBtn()} aria-label="닫기">×</button>
          </div>

          {/* Stat row */}
          <div style={{
            padding: mobile ? '14px 14px 0' : '20px 28px 0',
            display: 'grid',
            gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 10,
          }}>
            <Stat label="총 판수" value={t.plays} sub={wlTotal ? `${t.wins}W · ${t.losses}L` : '카운트 모드 포함'} accent={palette.cyan} />
            <Stat label="누적 승률" value={t.winRate != null ? `${t.winRate}%` : '—'} sub={wlTotal ? `${wlTotal}판 기준` : 'W/L 데이터 없음'} accent={t.winRate != null && t.winRate >= 50 ? palette.green : palette.red} />
            <Stat label="충족 주차" value={`${t.weeksGreen}/${t.weeksTotal}`} sub={`${greenRate}%`} accent={palette.green} />
            <Stat label="상태 분포" value={<StatusDots t={t} />} sub={`녹 ${t.weeksGreen} · 노 ${t.weeksYellow} · 적 ${t.weeksRed} · 회 ${t.weeksGray}`} accent={palette.cyan} />
          </div>

          {/* Spark / streak strip */}
          <div style={{ padding: mobile ? '14px 14px 4px' : '20px 28px 8px' }}>
            <SectionTitle>주별 컨디션</SectionTitle>
            <StreakStrip timeline={timeline} mobile={mobile} />
          </div>

          {/* Per-week table */}
          <div style={{ padding: mobile ? '8px 14px 18px' : '12px 28px 24px' }}>
            <SectionTitle>주별 상세</SectionTitle>
            <WeekTable timeline={timeline} mobile={mobile} />
          </div>
        </Sheet>
      </Backdrop>
    );
  }

  function Backdrop({ onClose, children }) {
    return (
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(4, 8, 16, 0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'sd-fadein .2s ease',
      }}>
        <style>{`
          @keyframes sd-fadein { from { opacity: 0; } to { opacity: 1; } }
          @keyframes sd-rise { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
        {children}
      </div>
    );
  }

  function Sheet({ mobile, children, onClose }) {
    return (
      <div onClick={(e) => e.stopPropagation()} style={{
        background: palette.bg,
        border: `1px solid ${palette.line2}`,
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        width: mobile ? '100%' : 'min(820px, calc(100% - 32px))',
        maxHeight: mobile ? '92vh' : '88vh',
        borderRadius: mobile ? '16px 16px 0 0' : 12,
        marginBottom: mobile ? 0 : 'auto',
        marginTop: mobile ? 'auto' : 'auto',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        animation: 'sd-rise .25s ease',
        position: 'relative',
      }}>
        {mobile && <div style={{
          width: 40, height: 4, background: palette.line2, borderRadius: 2,
          margin: '10px auto 0',
        }} />}
        {children}
      </div>
    );
  }

  function closeBtn() {
    return {
      width: 32, height: 32, borderRadius: 8,
      background: palette.panel2,
      border: `1px solid ${palette.line2}`,
      color: palette.text,
      fontSize: 20, lineHeight: 1, cursor: 'pointer',
      fontFamily: 'inherit',
      flexShrink: 0,
    };
  }

  function Pill({ color, bg, border, children }) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '3px 8px',
        borderRadius: 4, background: bg, color, border: `1px solid ${border}`,
        letterSpacing: 0.5,
      }}>{children}</span>
    );
  }

  function Stat({ label, value, sub, accent }) {
    return (
      <div style={{
        background: palette.panel,
        border: `1px solid ${palette.line}`,
        borderRadius: 8,
        padding: '12px 14px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: 2, width: '100%',
          background: `linear-gradient(90deg, ${accent} 0%, transparent 60%)`,
        }} />
        <div style={{ fontSize: 10, color: palette.label, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: palette.text, marginTop: 4, fontFamily: 'Space Grotesk, Inter, sans-serif', letterSpacing: -0.3 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: palette.dim, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
    );
  }

  function StatusDots({ t }) {
    const total = t.weeksGreen + t.weeksRed + t.weeksYellow + t.weeksGray;
    if (!total) return '—';
    const segs = [
      { c: palette.green, w: t.weeksGreen / total },
      { c: palette.yellow, w: t.weeksYellow / total },
      { c: palette.red, w: t.weeksRed / total },
      { c: palette.gray, w: t.weeksGray / total },
    ].filter((s) => s.w > 0);
    return (
      <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', marginTop: 2 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ flex: s.w, background: s.c, opacity: 0.85 }} />
        ))}
      </div>
    );
  }

  function SectionTitle({ children }) {
    return (
      <div style={{ fontSize: 11, fontWeight: 600, color: palette.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        {children}
      </div>
    );
  }

  function StreakStrip({ timeline, mobile }) {
    // Compress to a horizontal strip of small bars, one per week.
    return (
      <div style={{
        display: 'flex', gap: 3, alignItems: 'flex-end',
        background: palette.panel, border: `1px solid ${palette.line}`,
        borderRadius: 8, padding: '12px 14px',
        overflowX: 'auto',
      }}>
        {timeline.map((w, i) => {
          if (w.absent) {
            return <span key={i} title={`${w.weekName} · 미참여`} style={{ width: 8, height: 6, background: palette.line2, borderRadius: 1, flexShrink: 0 }} />;
          }
          const sc = statusColor[w.status] || statusColor.gray;
          // bar height encodes plays (capped at 16 plays for height of 36)
          const plays = w.plays || 0;
          const h = Math.max(8, Math.min(36, 4 + plays * 2.5));
          const rate = w.mode === 'wl' && w.plays ? `${w.rate}%` : null;
          return (
            <span key={i} title={`${w.weekName} · ${plays}판${rate ? ` · ${rate}` : ''}`} style={{
              width: 8, height: h,
              background: sc.fg, opacity: 0.85,
              borderRadius: 1, flexShrink: 0,
            }} />
          );
        })}
      </div>
    );
  }

  function WeekTable({ timeline, mobile }) {
    // Show only weeks where the player was present, most recent first.
    const present = timeline.filter((w) => !w.absent).slice().reverse();
    return (
      <div style={{
        background: palette.panel,
        border: `1px solid ${palette.line}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {present.length === 0 && <div style={{ padding: 16, color: palette.dim, fontSize: 12 }}>참여 기록이 없습니다.</div>}
        {present.map((w, i) => {
          const sc = statusColor[w.status] || statusColor.gray;
          return (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: mobile ? '1fr auto' : '120px 1fr auto auto',
              alignItems: 'center', gap: 12,
              padding: '10px 14px',
              borderBottom: i === present.length - 1 ? 'none' : `1px solid ${palette.line}`,
              background: sc.bg,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ width: 4, height: 22, background: sc.fg, borderRadius: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{w.weekName}</span>
              </div>
              {!mobile && (
                <div style={{ fontSize: 11, color: palette.dim, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.notes || '—'}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill color={sc.fg} bg={sc.bg} border={sc.line}>{sc.label}</Pill>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: palette.text, textAlign: 'right' }}>
                {w.mode === 'wl'
                  ? <span>{w.plays}판 <span style={{ color: w.rate >= 50 ? palette.green : palette.red }}>({w.rate}%)</span></span>
                  : <span>{w.plays}판</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  Object.assign(window.Stadium, { PlayerModal });
})();
