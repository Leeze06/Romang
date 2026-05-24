// Stadium · shared styles, palette, responsive hook, small chip components.

(function () {
  const { useState, useEffect } = React;

  const palette = {
    bg: '#0a1220',
    panel: '#0f1a2e',
    panel2: '#13243d',
    line: 'rgba(120, 180, 255, 0.08)',
    line2: 'rgba(120, 180, 255, 0.16)',
    text: '#dbe8ff',
    dim: '#7a8bad',
    label: '#5e7194',
    green: '#22d39a',
    greenSoft: 'rgba(34,211,154,0.12)',
    greenLine: 'rgba(34,211,154,0.45)',
    red: '#ff5b7a',
    redSoft: 'rgba(255,91,122,0.10)',
    redLine: 'rgba(255,91,122,0.45)',
    yellow: '#f5c244',
    yellowSoft: 'rgba(245,194,68,0.10)',
    yellowLine: 'rgba(245,194,68,0.40)',
    gray: '#5d6c87',
    graySoft: 'rgba(93,108,135,0.08)',
    cyan: '#5ad9ff',
    cyanDim: 'rgba(90,217,255,0.18)',
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
