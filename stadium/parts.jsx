// Stadium · table, sidebar, week selector, stat cards.

(function () {
  const { useState, useRef, useEffect } = React;
  const RD = window.RomangData;
  const { palette, statusColor, WLChips, CountChip } = window.Stadium;

  function StatCard({ label, value, sub, accent, mobile }) {
    return (
      <div style={{
        flex: 1, minWidth: 0,
        background: palette.panel,
        border: `1px solid ${palette.line}`,
        borderRadius: 10,
        padding: mobile ? '10px 12px' : '14px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, height: 2, width: '100%',
          background: `linear-gradient(90deg, ${accent || palette.cyan} 0%, transparent 60%)`,
        }} />
        <div style={{ fontSize: mobile ? 10 : 11, color: palette.label, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: mobile ? 22 : 28, fontWeight: 700, color: palette.text, marginTop: 4, fontFamily: 'Space Grotesk, Inter, sans-serif', letterSpacing: -0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        {sub ? <div style={{ fontSize: mobile ? 10 : 11, color: palette.dim, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div> : null}
      </div>
    );
  }

  function WeekSelector({ weekName, setWeekName, size }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const mobile = size === 'mobile';
    const idx = RD.weekIndex(weekName);
    const isLatest = idx === RD.WEEK_NAMES.length - 1;

    useEffect(() => {
      if (!open) return;
      const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    return (
      <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button onClick={() => setOpen((v) => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: mobile ? '7px 10px' : '8px 14px',
          background: palette.panel2,
          border: `1px solid ${palette.line2}`,
          borderRadius: 8,
          color: palette.text,
          fontSize: mobile ? 13 : 14, fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <span style={{ color: palette.cyan, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>WK</span>
          <span>{weekName}</span>
          {isLatest && !mobile && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: palette.greenSoft, color: palette.green, border: `1px solid ${palette.greenLine}` }}>LIVE</span>}
          <span style={{ color: palette.dim, fontSize: 9 }}>▼</span>
        </button>
        {!mobile && (
          <>
            <button onClick={() => { const p = RD.prevWeek(weekName); if (p) setWeekName(p); }} style={navBtn()} aria-label="prev week">‹</button>
            <button onClick={() => { const n = RD.nextWeek(weekName); if (n) setWeekName(n); }} style={navBtn()} aria-label="next week">›</button>
          </>
        )}
        {open && (
          <div style={{
            position: 'absolute', top: '100%', right: mobile ? 0 : 'auto', left: mobile ? 'auto' : 0, marginTop: 6,
            background: palette.panel2, border: `1px solid ${palette.line2}`,
            borderRadius: 8, padding: 4, zIndex: 30,
            maxHeight: 320, overflowY: 'auto',
            minWidth: 180,
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          }}>
            {RD.WEEK_NAMES.slice().reverse().map((w) => (
              <div key={w} onClick={() => { setWeekName(w); setOpen(false); }} style={{
                padding: '8px 12px', fontSize: 13, borderRadius: 5,
                color: w === weekName ? palette.cyan : palette.text,
                background: w === weekName ? palette.cyanDim : 'transparent',
                cursor: 'pointer',
              }} onMouseEnter={(e) => { if (w !== weekName) e.currentTarget.style.background = palette.line; }}
              onMouseLeave={(e) => { if (w !== weekName) e.currentTarget.style.background = 'transparent'; }}>
                {w}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  function navBtn() {
    return {
      width: 32, height: 36,
      background: palette.panel2, border: `1px solid ${palette.line2}`,
      borderRadius: 8, color: palette.text, fontSize: 16, cursor: 'pointer',
      fontFamily: 'inherit',
    };
  }

  // ---- Roster Table ------------------------------------------------------

  function Table({ week, shape, size, onPickPlayer }) {
    const { dayCount, dayCols } = shape;
    const mobile = size === 'mobile';

    // Filter state — query (nickname substring) + status toggle set.
    // Default: all statuses ON. Reset whenever the week changes.
    const ALL_STATUSES = ['green', 'yellow', 'red', 'gray'];
    const [query, setQuery] = useState('');
    const [activeStatuses, setActiveStatuses] = useState(() => new Set(ALL_STATUSES));
    useEffect(() => {
      setQuery('');
      setActiveStatuses(new Set(ALL_STATUSES));
    }, [week]); // eslint-disable-line

    const filteredRows = week.rows.filter((row) => {
      const nick = String(row.before[0] || '');
      const matchQuery = query === '' || nick.toLowerCase().includes(query.toLowerCase());
      const matchStatus = activeStatuses.has(row.status || 'gray');
      return matchQuery && matchStatus;
    });

    const isFiltered = query !== '' || activeStatuses.size < ALL_STATUSES.length;

    function toggleStatus(s) {
      setActiveStatuses((prev) => {
        const next = new Set(prev);
        if (next.has(s)) next.delete(s);
        else next.add(s);
        // Empty set acts like "all" — UX guard against zero rows.
        if (next.size === 0) return new Set(ALL_STATUSES);
        return next;
      });
    }
    function clearFilters() {
      setQuery('');
      setActiveStatuses(new Set(ALL_STATUSES));
    }

    return (
      <div style={{
        background: palette.panel,
        border: `1px solid ${palette.line}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: palette.dim }}>Daily Roster</div>
            {isFiltered && (
              <span style={{ fontSize: 11, color: palette.cyan, fontFamily: 'JetBrains Mono, monospace' }}>
                {filteredRows.length}/{week.rows.length} 표시
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: palette.label, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{week.mode === 'wl' ? 'W/L MODE' : 'COUNT MODE'} · {dayCount} DAYS</div>
        </div>

        <FilterBar
          mobile={mobile}
          query={query} setQuery={setQuery}
          activeStatuses={activeStatuses} toggleStatus={toggleStatus}
          isFiltered={isFiltered} clearFilters={clearFilters}
          allStatuses={ALL_STATUSES}
          counts={statusCounts(week)}
        />

        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12, minWidth: mobile ? 640 : 'auto' }}>
            <thead>
              <tr>
                <th style={th({ left: true, sticky: mobile })}>플레이어</th>
                {dayCols.map((c, i) => {
                  const rolled = RD.dayRollup(week, i);
                  const met = rolled.plays >= 12;
                  return (
                    <th key={i} style={th({})}>
                      <div style={{ fontSize: 10, color: palette.label, fontWeight: 500 }}>{c.replace('월 ', '/').replace('일', '')}</div>
                      <div style={{
                        marginTop: 4, fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                        color: met ? palette.green : palette.red,
                      }}>{rolled.plays}{rolled.plays < 12 ? <span style={{ color: palette.label, opacity: 0.6 }}>/12</span> : null}</div>
                    </th>
                  );
                })}
                <th style={th({ right: true })}>합산</th>
                {week.columns.slice(shape.totalIdx + 1).map((c, i) => (
                  <th key={i} style={th({ right: true })}>{c || '비고'}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr><td colSpan={1 + dayCount + 1 + (week.columns.length - shape.totalIdx - 1)} style={{ padding: 24, textAlign: 'center', color: palette.dim, fontSize: 12 }}>일치하는 플레이어가 없습니다.</td></tr>
              )}
              {filteredRows.map((row, i) => {
                const s = RD.rowStats(week, row);
                const sc = statusColor[row.status] || statusColor.gray;
                return (
                  <tr key={i} className="sd-row" style={{ background: sc.bg }}>
                    <td style={{ ...td({ left: true, sticky: mobile }), background: mobile ? blendOnPanel(sc.bg) : undefined }}>
                      <button onClick={() => onPickPlayer(row.before[0])} style={playerBtn()}>
                        <span style={{
                          width: 6, height: 24, borderRadius: 2,
                          background: sc.fg,
                          boxShadow: row.status === 'green' ? `0 0 8px ${sc.fg}` : 'none',
                        }} />
                        <span style={{ fontWeight: 600, color: palette.text }}>{row.before[0]}</span>
                      </button>
                    </td>
                    {row.before.slice(1, 1 + dayCount).map((v, j) => (
                      <td key={j} style={td({})}>{week.mode === 'wl' ? <WLChips value={v} /> : <CountChip value={v} />}</td>
                    ))}
                    <td style={td({ right: true, mono: true })}>
                      {week.mode === 'wl'
                        ? <span style={{ fontWeight: 700, color: palette.text }}>{s.plays} <span style={{ color: palette.dim, fontSize: 11 }}>({s.rate}%)</span></span>
                        : <span style={{ fontWeight: 700, color: s.plays >= 7 ? palette.green : palette.red }}>{s.plays}</span>}
                    </td>
                    {row.after.map((v, j) => (
                      <td key={j} style={{ ...td({ right: true }), color: palette.dim, fontSize: 11, maxWidth: 180, whiteSpace: 'normal' }}>{v || ''}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <style>{`.sd-row:hover { filter: brightness(1.18); }`}</style>
      </div>
    );
  }

  // Sticky cell needs a near-opaque background or the row tint bleeds through
  // when content scrolls beneath. We blend the row tint with the panel color.
  function blendOnPanel(rgbaTint) {
    return `linear-gradient(${rgbaTint}, ${rgbaTint}), ${palette.panel}`;
  }

  function th({ left, right, sticky }) {
    return {
      padding: left ? '12px 14px 12px 18px' : right ? '12px 14px' : '8px 6px',
      textAlign: left ? 'left' : 'center',
      fontSize: 10, fontWeight: 600, color: palette.label,
      textTransform: 'uppercase', letterSpacing: 1,
      background: palette.panel2,
      borderBottom: `1px solid ${palette.line2}`,
      whiteSpace: 'nowrap',
      ...(sticky ? { position: 'sticky', left: 0, zIndex: 2 } : null),
    };
  }
  function td({ left, right, mono, sticky }) {
    return {
      padding: left ? '10px 14px 10px 18px' : right ? '10px 14px' : '8px 4px',
      textAlign: left ? 'left' : 'center',
      borderBottom: `1px solid ${palette.line}`,
      fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
      whiteSpace: 'nowrap',
      ...(sticky ? { position: 'sticky', left: 0, zIndex: 1 } : null),
    };
  }
  function playerBtn() {
    return {
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'transparent', border: 'none', padding: 0,
      cursor: 'pointer', font: 'inherit', color: 'inherit',
    };
  }

  // ---- Filter Bar --------------------------------------------------------

  function statusCounts(week) {
    const c = { green: 0, yellow: 0, red: 0, gray: 0 };
    week.rows.forEach((r) => {
      const k = r.status || 'gray';
      if (c[k] != null) c[k] += 1;
    });
    return c;
  }

  const statusMeta = {
    green: { label: '충족', short: '충족' },
    yellow: { label: '사유', short: '사유' },
    red: { label: '미달', short: '미달' },
    gray: { label: '기타', short: '기타' },
  };

  function FilterBar({ mobile, query, setQuery, activeStatuses, toggleStatus, isFiltered, clearFilters, allStatuses, counts }) {
    return (
      <div style={{
        padding: mobile ? '10px 14px' : '12px 18px',
        borderBottom: `1px solid ${palette.line}`,
        background: palette.bg,
        display: 'flex',
        flexDirection: mobile ? 'column' : 'row',
        alignItems: mobile ? 'stretch' : 'center',
        gap: 10,
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: mobile ? '0 0 auto' : '0 0 220px',
          maxWidth: mobile ? '100%' : 260,
        }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: palette.label, fontSize: 12, pointerEvents: 'none',
          }}>⌕</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="닉네임 검색"
            style={{
              width: '100%',
              padding: '7px 28px 7px 28px',
              background: palette.panel2,
              border: `1px solid ${palette.line2}`,
              borderRadius: 6,
              color: palette.text,
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = palette.cyan; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = palette.line2; }}
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="검색 지우기" style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, borderRadius: 9,
              background: palette.line2, border: 'none', color: palette.text,
              fontSize: 12, lineHeight: 1, cursor: 'pointer',
            }}>×</button>
          )}
        </div>

        {/* Status toggles */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {allStatuses.map((s) => {
            const meta = statusMeta[s];
            const sc = statusColor[s];
            const on = activeStatuses.has(s);
            return (
              <button key={s} onClick={() => toggleStatus(s)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 10px',
                background: on ? sc.bg : 'transparent',
                border: `1px solid ${on ? sc.line : palette.line2}`,
                borderRadius: 999,
                color: on ? sc.fg : palette.label,
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background .12s, border-color .12s, color .12s',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 4,
                  background: sc.fg,
                  opacity: on ? 1 : 0.4,
                  boxShadow: on && s === 'green' ? `0 0 6px ${sc.fg}` : 'none',
                }} />
                <span>{meta.short}</span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  color: on ? sc.fg : palette.label,
                  opacity: on ? 0.8 : 0.6,
                }}>{counts[s] || 0}</span>
              </button>
            );
          })}
        </div>

        {/* Clear */}
        {isFiltered && (
          <button onClick={clearFilters} style={{
            padding: '5px 10px',
            background: 'transparent',
            border: `1px dashed ${palette.line2}`,
            borderRadius: 6,
            color: palette.dim,
            fontSize: 11, fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}>필터 초기화</button>
        )}
      </div>
    );
  }

  // ---- Sidebar -----------------------------------------------------------

  function Sidebar({ leaderboard, consistency, leftCount, onPickPlayer, size }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SidePanel title="누적 승률 TOP" hint="14판 이상 · 현역만">
          {leaderboard.map((p, i) => (
            <LBRow key={p.nick} rank={i + 1} name={p.nick} primary={`${p.totals.winRate}%`} sub={`${p.totals.wins}W·${p.totals.losses}L`} accent={i === 0 ? palette.green : palette.cyan} onClick={() => onPickPlayer(p.nick)} />
          ))}
        </SidePanel>
        <SidePanel title="개근왕" hint="충족 주차 비율 · 현역만">
          {consistency.map((p, i) => (
            <LBRow key={p.nick} rank={i + 1} name={p.nick} primary={`${p.totals.weeksGreen}/${p.totals.weeksTotal}`} sub={`${Math.round(p.greenRate * 100)}% 충족`} accent={palette.green} onClick={() => onPickPlayer(p.nick)} />
          ))}
        </SidePanel>
        {leftCount > 0 && (
          <div style={{
            padding: '10px 14px',
            background: 'transparent',
            border: `1px dashed ${palette.line2}`,
            borderRadius: 8,
            fontSize: 11, color: palette.label,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: palette.dim }}>⊘</span>
            <span>탈퇴자 <span style={{ color: palette.text, fontWeight: 700 }}>{leftCount}명</span> 랭킹에서 제외</span>
          </div>
        )}
      </div>
    );
  }
  function SidePanel({ title, hint, children }) {
    return (
      <div style={{
        background: palette.panel,
        border: `1px solid ${palette.line}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${palette.line}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: palette.dim }}>{title}</div>
          <div style={{ fontSize: 10, color: palette.label }}>{hint}</div>
        </div>
        <div style={{ padding: 4 }}>{children}</div>
      </div>
    );
  }
  function LBRow({ rank, name, primary, sub, accent, onClick }) {
    return (
      <button onClick={onClick} className="sd-lb-row" style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
        width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
        color: 'inherit', font: 'inherit', cursor: 'pointer',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 4,
          background: rank <= 3 ? palette.cyanDim : 'transparent',
          border: `1px solid ${rank <= 3 ? palette.cyan : palette.line2}`,
          fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
          color: rank <= 3 ? palette.cyan : palette.dim,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontSize: 10, color: palette.label }}>{sub}</div>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: accent }}>{primary}</div>
      </button>
    );
  }

  Object.assign(window.Stadium, { StatCard, WeekSelector, Table, Sidebar });
})();
