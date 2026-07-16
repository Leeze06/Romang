// Stadium · shared styles, palette, responsive hook, small chip components.

(function () {
  const { useState, useEffect } = React;

  // 시안 C · 웜 크림 + 다크 네이비 히어로. 브랜드 골드/네이비 액센트.
  const palette = {
    bg: '#f4ebd8',        // warm cream page
    panel: '#ffffff',     // white cards
    panel2: '#f6efe0',    // warm raised / hover
    line: '#e7ddc9',      // warm hairline
    line2: '#d6cab0',     // warm strong hairline
    text: '#181d26',      // ink
    dim: '#5f6670',
    label: '#9a917f',
    green: '#0b7a4f',
    greenSoft: 'rgba(11,122,79,0.10)',
    greenLine: 'rgba(11,122,79,0.32)',
    red: '#c0392b',
    redSoft: 'rgba(192,57,43,0.09)',
    redLine: 'rgba(192,57,43,0.32)',
    yellow: '#b07d17',
    yellowSoft: 'rgba(176,125,23,0.12)',
    yellowLine: 'rgba(176,125,23,0.35)',
    gray: '#8a8172',
    graySoft: 'rgba(138,129,114,0.10)',
    cyan: '#1c3a6e',      // brand navy (accent)
    cyanDim: 'rgba(28,58,110,0.10)',
    navy: '#12213f',
    gold: '#d9b25a',
    goldSoft: '#f2e2b6',
  };

  const statusColor = {
    green: { fg: palette.green, bg: palette.greenSoft, line: palette.greenLine, label: '충족' },
    red: { fg: palette.red, bg: palette.redSoft, line: palette.redLine, label: '미달' },
    yellow: { fg: palette.yellow, bg: palette.yellowSoft, line: palette.yellowLine, label: '사유' },
    gray: { fg: palette.gray, bg: palette.graySoft, line: 'rgba(93,108,135,0.3)', label: '기타' },
  };

  function sizeBucket(w) {
    if (w < 640) return 'mobile';
    if (w < 1100) return 'tablet';
    return 'desktop';
  }
  function useResponsive() {
    const [size, setSize] = useState(() =>
      typeof window !== 'undefined' ? sizeBucket(window.innerWidth) : 'desktop'
    );
    useEffect(() => {
      const onResize = () => setSize(sizeBucket(window.innerWidth));
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);
    return size;
  }

  function WLChips({ value, big }) {
    if (!value) return <span style={{ color: palette.label, opacity: 0.4 }}>·</span>;
    const chars = String(value).split('');
    const wh = big ? 20 : 16;
    const fs = big ? 12 : 10;
    return (
      <span style={{ display: 'inline-flex', gap: 2, justifyContent: 'center' }}>
        {chars.map((c, i) => (
          <span key={i} style={{
            display: 'inline-block',
            width: wh, height: wh + 2, lineHeight: `${wh + 2}px`,
            fontSize: fs, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            borderRadius: 3,
            background: c === 'W' ? palette.greenSoft : palette.redSoft,
            color: c === 'W' ? palette.green : palette.red,
            border: `1px solid ${c === 'W' ? palette.greenLine : palette.redLine}`,
          }}>{c}</span>
        ))}
      </span>
    );
  }

  function CountChip({ value }) {
    if (!value || value === '0') return <span style={{ color: palette.label, opacity: 0.4 }}>·</span>;
    return (
      <span style={{
        display: 'inline-block',
        minWidth: 22, padding: '2px 6px',
        fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
        color: palette.cyan,
        background: palette.cyanDim,
        borderRadius: 4,
      }}>{value}</span>
    );
  }

  window.Stadium = window.Stadium || {};
  Object.assign(window.Stadium, { palette, statusColor, useResponsive, WLChips, CountChip });
})();
