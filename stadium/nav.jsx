// Stadium · shared sub-page chrome: emblem, top nav (길랭표/이벤트/랭킹), page shell.

(function () {
  const S = window.Stadium;
  const { palette } = S;

  const TABS = [
    { id: 'guild', label: '길랭표', href: 'guild.html' },
    { id: 'event', label: '이벤트', href: 'event.html' },
    { id: 'ranking', label: '랭킹', href: 'ranking.html' },
  ];

  function Emblem({ size = 34 }) {
    return (
      <img
        src="assets/romang-emblem.png"
        alt="Romang"
        style={{
          height: size, width: 'auto',
          display: 'block', objectFit: 'contain',
          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))',
          flexShrink: 0,
        }}
      />
    );
  }

  function NavBar({ current, size }) {
    const mobile = size === 'mobile';
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: mobile ? 16 : 24, flexWrap: 'wrap',
      }}>
        <a href="index.html" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Emblem size={mobile ? 36 : 42} />
          <span style={{
            fontFamily: 'Pretendard Variable, sans-serif',
            fontSize: mobile ? 17 : 20, fontWeight: 800, letterSpacing: 2.5,
            color: palette.text,
          }}>ROMANG</span>
        </a>
      </div>
    );
  }

  function PageShell({ current, size, children, maxWidth = 1200, title, subtitle, right }) {
    const mobile = size === 'mobile';
    const tablet = size === 'tablet';
    return (
      <div style={{
        minHeight: '100vh',
        background: palette.bg,
        color: palette.text,
        fontFamily: 'Pretendard Variable, "Apple SD Gothic Neo", sans-serif',
        padding: mobile ? 12 : tablet ? 18 : 24,
        backgroundImage: `radial-gradient(circle at 20% 0%, rgba(90,217,255,0.06), transparent 50%), radial-gradient(circle at 90% 100%, rgba(34,211,154,0.05), transparent 50%)`,
        boxSizing: 'border-box',
      }}>
        <div style={{ maxWidth, margin: '0 auto' }}>
          <NavBar current={current} size={size} />
          {(title || right) && (
            <div style={{
              display: 'flex', alignItems: mobile ? 'stretch' : 'flex-end',
              flexDirection: mobile ? 'column' : 'row',
              justifyContent: 'space-between', gap: mobile ? 10 : 16,
              marginBottom: mobile ? 14 : 20,
            }}>
              <div>
                {title && <h1 style={{ margin: 0, fontSize: mobile ? 24 : 30, fontWeight: 800, letterSpacing: -0.5, fontFamily: 'Pretendard Variable, sans-serif', color: palette.text }}>{title}</h1>}
                {subtitle && <div style={{ marginTop: 6, fontSize: mobile ? 12 : 13, color: palette.dim }}>{subtitle}</div>}
              </div>
              {right && <div style={{ display: 'flex', justifyContent: mobile ? 'flex-start' : 'flex-end' }}>{right}</div>}
            </div>
          )}
          {children}
          <div style={{
            marginTop: 24, padding: '14px 0', textAlign: 'center',
            fontSize: 10, color: palette.label, letterSpacing: 2, textTransform: 'uppercase',
          }}>
            로망 랭크전 현황표
          </div>
        </div>
      </div>
    );
  }

  Object.assign(S, { NavBar, PageShell, Emblem, TABS });
})();
