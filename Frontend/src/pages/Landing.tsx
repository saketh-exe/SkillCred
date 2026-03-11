import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   STARFIELD CANVAS
───────────────────────────────────────────── */
function Starfield() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let raf;
    const stars = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 160; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.15,
        o: Math.random() * 0.6 + 0.1,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.008 + 0.003,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.001;
      stars.forEach(s => {
        const opacity = s.o * (0.55 + 0.45 * Math.sin(t * s.speed * 6 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196, 170, 255, ${opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   THEME TOGGLE
───────────────────────────────────────────── */
function ThemeToggle({ dark, onToggle }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={dark ? "Light mode" : "Dark mode"}
      style={{
        position: "relative",
        width: 56,
        height: 28,
        borderRadius: 14,
        border: `1.5px solid ${hov ? "rgba(167,139,250,0.7)" : "rgba(139,92,246,0.35)"}`,
        background: dark
          ? "linear-gradient(135deg,rgba(88,28,135,0.5),rgba(55,14,121,0.4))"
          : "linear-gradient(135deg,rgba(253,224,71,0.25),rgba(251,191,36,0.15))",
        cursor: "pointer",
        outline: "none",
        transition: "all 0.3s ease",
        boxShadow: hov
          ? "0 0 18px rgba(139,92,246,0.55)"
          : "0 0 8px rgba(139,92,246,0.2)",
        flexShrink: 0,
      }}
    >
      {/* Sun icon */}
      <svg
        width="12" height="12"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        style={{
          position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)",
          color: dark ? "rgba(167,139,250,0.35)" : "#FCD34D",
          transition: "all 0.3s", opacity: dark ? 0.4 : 1,
        }}
      >
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      {/* Moon icon */}
      <svg
        width="11" height="11"
        viewBox="0 0 24 24" fill="currentColor"
        style={{
          position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)",
          color: dark ? "#C4B5FD" : "rgba(196,181,253,0.3)",
          transition: "all 0.3s", opacity: dark ? 1 : 0.35,
        }}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
      {/* Thumb */}
      <div
        style={{
          position: "absolute",
          top: 3,
          left: dark ? 31 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: dark
            ? "linear-gradient(135deg,#C084FC,#7C3AED)"
            : "linear-gradient(135deg,#FDE68A,#F59E0B)",
          boxShadow: dark
            ? "0 0 12px rgba(192,132,252,0.9), 0 2px 8px rgba(0,0,0,0.5)"
            : "0 0 12px rgba(251,191,36,0.9), 0 2px 6px rgba(0,0,0,0.2)",
          transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────
   NAV LINK
───────────────────────────────────────────── */
function NavLink({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "none",
        border: "none",
        color: hov ? "#E9D5FF" : "#A78BFA",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        padding: "6px 12px",
        borderRadius: 8,
        transition: "all 0.2s",
        letterSpacing: "0.01em",
        background: hov ? "rgba(139,92,246,0.12)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   PRIMARY BUTTON
───────────────────────────────────────────── */
function PrimaryBtn({ children, onClick, large = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? "linear-gradient(135deg,#A855F7,#6D28D9)"
          : "linear-gradient(135deg,#7C3AED,#5B21B6)",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: large ? "15px 34px" : "10px 22px",
        fontSize: large ? 16 : 14,
        fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
        cursor: "pointer",
        letterSpacing: "0.01em",
        transition: "all 0.25s ease",
        boxShadow: hov
          ? "0 0 36px rgba(139,92,246,0.75), 0 8px 24px rgba(0,0,0,0.4)"
          : "0 0 20px rgba(139,92,246,0.4), 0 4px 16px rgba(0,0,0,0.3)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   GHOST BUTTON
───────────────────────────────────────────── */
function GhostBtn({ children, onClick, large = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(139,92,246,0.12)" : "transparent",
        color: hov ? "#E9D5FF" : "#C4B5FD",
        border: `1.5px solid ${hov ? "rgba(167,139,250,0.6)" : "rgba(139,92,246,0.3)"}`,
        borderRadius: 10,
        padding: large ? "15px 34px" : "10px 22px",
        fontSize: large ? 16 : 14,
        fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
        cursor: "pointer",
        letterSpacing: "0.01em",
        transition: "all 0.25s ease",
        backdropFilter: "blur(8px)",
        boxShadow: hov ? "0 0 20px rgba(139,92,246,0.25)" : "none",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   STAT ITEM
───────────────────────────────────────────── */
function StatItem({ value, label }) {
  return (
    <div style={{ textAlign: "center", padding: "0 24px" }}>
      <div
        style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: "clamp(24px,4vw,34px)",
          fontWeight: 900,
          background: "linear-gradient(135deg,#C084FC,#818CF8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1.1,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#7C6B9E",
          marginTop: 6,
          fontWeight: 500,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FEATURE CARD ICON
───────────────────────────────────────────── */
function VerifyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}
function MatchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  );
}
function GapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function ReadinessIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   FEATURE CARD
───────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov
          ? "linear-gradient(135deg,rgba(30,16,60,0.92),rgba(20,10,50,0.88))"
          : "linear-gradient(135deg,rgba(20,10,48,0.85),rgba(12,6,30,0.8))",
        border: `1px solid ${hov ? "rgba(139,92,246,0.55)" : "rgba(109,40,217,0.25)"}`,
        borderRadius: 18,
        padding: "30px 28px",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "all 0.3s ease",
        boxShadow: hov
          ? "0 0 40px rgba(109,40,217,0.35), 0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(167,139,250,0.15)"
          : "0 0 20px rgba(55,14,121,0.2), 0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(167,139,250,0.06)",
        cursor: "default",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      {/* Icon badge */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 13,
          background: hov
            ? "linear-gradient(135deg,rgba(139,92,246,0.3),rgba(91,33,182,0.2))"
            : "linear-gradient(135deg,rgba(109,40,217,0.2),rgba(55,14,121,0.15))",
          border: `1px solid ${hov ? "rgba(167,139,250,0.4)" : "rgba(109,40,217,0.25)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          boxShadow: hov ? "0 0 20px rgba(139,92,246,0.35)" : "0 0 8px rgba(109,40,217,0.15)",
          transition: "all 0.3s ease",
        }}
      >
        <Icon />
      </div>
      <h3
        style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 17,
          fontWeight: 700,
          color: hov ? "#F5F3FF" : "#DDD6FE",
          marginBottom: 10,
          letterSpacing: "-0.3px",
          transition: "color 0.3s",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 14,
          color: hov ? "#A78BFA" : "#6D5B8E",
          lineHeight: 1.7,
          margin: 0,
          transition: "color 0.3s",
        }}
      >
        {desc}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DIVIDER LINE
───────────────────────────────────────────── */
function Divider() {
  return (
    <div
      style={{
        width: "100%",
        height: 1,
        background: "linear-gradient(90deg,transparent,rgba(109,40,217,0.35),rgba(139,92,246,0.25),transparent)",
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   FOOTER LINK
───────────────────────────────────────────── */
function FooterLink({ children }) {
  const [hov, setHov] = useState(false);
  return (
    <span
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontSize: 13,
        color: hov ? "#A78BFA" : "#4C3A6E",
        cursor: "pointer",
        transition: "color 0.2s",
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────
   SCROLL INDICATOR
───────────────────────────────────────────── */
function ScrollIndicator() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* Vertical line with gradient fade */}
      <div
        style={{
          width: 1,
          height: 48,
          background: "linear-gradient(to bottom, rgba(139,92,246,0.7), transparent)",
        }}
      />
      <span
        style={{
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#4C3A6E",
          fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Scroll to explore
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────── */
export default function SkillCredLanding() {
  const [dark, setDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: VerifyIcon,
      title: "Skill Verification",
      desc: "AI-powered assessments verify actual competency — not just claimed experience on a résumé.",
    },
    {
      icon: MatchIcon,
      title: "Smart Matching",
      desc: "Algorithmic job matching based on verified skills and exact role requirements.",
    },
    {
      icon: GapIcon,
      title: "Skill Gap Insights",
      desc: "Personalized roadmap showing exactly what to learn to land your target role.",
    },
    {
      icon: ReadinessIcon,
      title: "Readiness Score",
      desc: "A composite score showing how prepared you are for specific job applications.",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #07061A; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #07061A; }
        ::-webkit-scrollbar-thumb { background: rgba(109,40,217,0.4); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.6); }

        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatGlow {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
          50%       { transform: translateY(-12px) scale(1.04); opacity: 0.85; }
        }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.5); }
          50%       { box-shadow: 0 0 0 8px rgba(139,92,246,0); }
        }

        .fade-1 { animation: fadeUpIn 0.7s ease both; animation-delay: 0.05s; }
        .fade-2 { animation: fadeUpIn 0.7s ease both; animation-delay: 0.18s; }
        .fade-3 { animation: fadeUpIn 0.7s ease both; animation-delay: 0.32s; }
        .fade-4 { animation: fadeUpIn 0.7s ease both; animation-delay: 0.46s; }
        .fade-5 { animation: fadeUpIn 0.7s ease both; animation-delay: 0.58s; }
        .fade-6 { animation: fadeUpIn 0.7s ease both; animation-delay: 0.7s; }
      `}</style>

      {/* ── Background Layer ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(88,28,135,0.28) 0%, transparent 70%)," +
            "radial-gradient(ellipse 50% 40% at 85% 60%, rgba(79,70,229,0.1) 0%, transparent 60%)," +
            "radial-gradient(ellipse 40% 50% at 10% 80%, rgba(109,40,217,0.08) 0%, transparent 55%)," +
            "#07061A",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Starfield />

      {/* ── WRAPPER ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "'DM Sans', sans-serif",
          color: "#E9D5FF",
          minHeight: "100vh",
        }}
      >
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            NAVBAR
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 200,
            padding: "0 clamp(20px, 5vw, 60px)",
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: scrolled
              ? "rgba(7,6,26,0.88)"
              : "rgba(7,6,26,0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid ${scrolled ? "rgba(109,40,217,0.3)" : "rgba(109,40,217,0.12)"}`,
            transition: "all 0.35s ease",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#7C3AED,#4C1D95)",
                border: "1.5px solid rgba(167,139,250,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(124,58,237,0.6)",
                animation: "pulseRing 3s ease infinite",
              }}
            >
              <span
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: 12,
                  color: "#F5F3FF",
                  letterSpacing: "-0.3px",
                }}
              >
                SC
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: "#EDE9FE",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              SKILLCRED
            </span>
          </div>

          {/* Center nav + toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <NavLink>Student</NavLink>
            <NavLink>Recruiter</NavLink>
            <div style={{ marginLeft: 8 }}>
              <ThemeToggle dark={dark} onToggle={() => setDark(!dark)} />
            </div>
          </div>

          {/* CTA */}
          <PrimaryBtn>Open App &nbsp;&#8594;</PrimaryBtn>
        </header>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HERO
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          style={{
            padding: "clamp(80px,12vw,130px) clamp(20px,5vw,60px) clamp(60px,8vw,100px)",
            maxWidth: 1100,
            margin: "0 auto",
            position: "relative",
          }}
        >
          {/* Ghost watermark */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              transform: "translateY(-55%)",
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(64px,13vw,168px)",
              fontWeight: 900,
              color: "transparent",
              WebkitTextStroke: "1px rgba(109,40,217,0.07)",
              letterSpacing: "-4px",
              userSelect: "none",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              lineHeight: 1,
              animation: "floatGlow 8s ease-in-out infinite",
            }}
          >
            SKILLCRED
          </div>

          {/* Pill badge */}
          <div className="fade-1" style={{ marginBottom: 32 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: "rgba(88,28,135,0.22)",
                border: "1px solid rgba(139,92,246,0.35)",
                borderRadius: 30,
                padding: "7px 18px 7px 12px",
                backdropFilter: "blur(10px)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#A855F7",
                  boxShadow: "0 0 10px #A855F7",
                  display: "inline-block",
                  animation: "pulseRing 2s ease infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#C084FC",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Skill-Based Hiring Platform
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1
            className="fade-2"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(46px,8vw,92px)",
              fontWeight: 900,
              lineHeight: 1.03,
              letterSpacing: "clamp(-2px,-0.03em,-3px)",
              marginBottom: 28,
              position: "relative",
            }}
          >
            <span style={{ color: "#EDE9FE", display: "block" }}>HIRE BY</span>
            <span
              style={{
                display: "block",
                background: "linear-gradient(120deg,#A855F7 0%,#C084FC 40%,#818CF8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              SKILL.
            </span>
            <span style={{ color: "#EDE9FE", display: "block" }}>NOT BY RÉSUMÉ.</span>
          </h1>

          {/* Subtext */}
          <p
            className="fade-3"
            style={{
              fontSize: "clamp(15px,1.6vw,18px)",
              color: "#6D5B8E",
              lineHeight: 1.75,
              maxWidth: 560,
              marginBottom: 52,
            }}
          >
            SkillCred connects students with verified skills to recruiters who
            care about what you actually know&nbsp;— not just where you studied.
          </p>

          {/* CTAs */}
          <div
            className="fade-4"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 60,
              flexWrap: "wrap",
            }}
          >
            <PrimaryBtn large>I'm a Student &nbsp;&#8594;</PrimaryBtn>
            <GhostBtn large>I'm a Recruiter</GhostBtn>
          </div>

          {/* Scroll hint */}
          <div className="fade-5">
            <ScrollIndicator />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            STATS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Divider />
        <section
          style={{
            padding: "40px clamp(20px,5vw,60px)",
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px 0",
          }}
        >
          {[
            ["10,000+", "Students verified"],
            ["500+", "Recruiters"],
            ["94%", "Hiring accuracy"],
            ["2.3M+", "Skills assessed"],
          ].map(([val, label], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <StatItem value={val} label={label} />
              {i < 3 && (
                <div
                  style={{
                    width: 1,
                    height: 36,
                    background: "rgba(109,40,217,0.3)",
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))}
        </section>
        <Divider />

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FEATURES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          style={{
            padding: "clamp(60px,10vw,100px) clamp(20px,5vw,60px)",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {/* Section header */}
          <div style={{ marginBottom: 56, textAlign: "center" }}>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#5B21B6",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              Platform Capabilities
            </p>
            <h2
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: "clamp(28px,4vw,44px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1px",
                color: "#EDE9FE",
              }}
            >
              Everything you need to{" "}
              <span
                style={{
                  background: "linear-gradient(120deg,#A855F7,#818CF8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                hire smarter
              </span>
            </h2>
          </div>

          {/* Cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 22,
            }}
          >
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CTA BAND
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Divider />
        <section
          style={{
            padding: "clamp(60px,8vw,90px) clamp(20px,5vw,60px)",
            maxWidth: 700,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#5B21B6",
              fontWeight: 700,
              marginBottom: 18,
            }}
          >
            Get Started Today
          </p>
          <h2
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(26px,4vw,40px)",
              fontWeight: 800,
              color: "#EDE9FE",
              letterSpacing: "-1px",
              lineHeight: 1.15,
              marginBottom: 20,
            }}
          >
            Skills speak louder than résumés.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "#6D5B8E",
              lineHeight: 1.7,
              marginBottom: 40,
            }}
          >
            Join thousands of students and recruiters building
            a more honest, skill-first hiring ecosystem.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <PrimaryBtn large>I'm a Student &nbsp;&#8594;</PrimaryBtn>
            <GhostBtn large>I'm a Recruiter</GhostBtn>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FOOTER
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Divider />
        <footer
          style={{
            padding: "28px clamp(20px,5vw,60px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Logo left */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#6D28D9,#4C1D95)",
                border: "1px solid rgba(139,92,246,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 10px rgba(109,40,217,0.4)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: 9,
                  color: "#F5F3FF",
                }}
              >
                SC
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: "#4C3A6E",
                letterSpacing: "0.05em",
              }}
            >
              SkillCred &copy; 2025
            </span>
          </div>

          {/* Links right */}
          <div style={{ display: "flex", gap: 28 }}>
            {["Privacy", "Terms", "About", "Contact"].map((l) => (
              <FooterLink key={l}>{l}</FooterLink>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}