import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Limit Break — Calculus 1 Practice Game" },
      { name: "description", content: "Solve limits, derivatives and integrals. Build streaks, earn points, level up." },
      { property: "og:title", content: "Limit Break — Calculus 1 Practice Game" },
      { property: "og:description", content: "Solve limits, derivatives and integrals. Build streaks, earn points, level up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

type Topic = "Limits" | "Derivatives" | "Integrals" | "Applications";
interface Problem {
  topic: Topic;
  difficulty: 1 | 2 | 3;
  q: string;
  choices: string[];
  answer: number;
  hint: string;
}

const PROBLEMS: Problem[] = [
  { topic: "Limits", difficulty: 1, q: "lim x→2 of (3x + 1)", choices: ["5", "7", "6", "∞"], answer: 1, hint: "Polynomials are continuous — just substitute." },
  { topic: "Limits", difficulty: 2, q: "lim x→3 of (x² − 9)/(x − 3)", choices: ["0", "3", "6", "undefined"], answer: 2, hint: "Factor x² − 9 = (x−3)(x+3)." },
  { topic: "Limits", difficulty: 2, q: "lim x→0 of sin(x)/x", choices: ["0", "1", "∞", "does not exist"], answer: 1, hint: "A classic squeeze-theorem result." },
  { topic: "Limits", difficulty: 3, q: "lim x→∞ of (2x² + 1)/(5x² − x)", choices: ["0", "2/5", "∞", "1"], answer: 1, hint: "Compare leading coefficients." },
  { topic: "Derivatives", difficulty: 1, q: "d/dx [x⁵]", choices: ["5x⁴", "x⁴", "5x⁵", "4x⁵"], answer: 0, hint: "Power rule: n·xⁿ⁻¹." },
  { topic: "Derivatives", difficulty: 2, q: "d/dx [sin(3x)]", choices: ["cos(3x)", "3cos(3x)", "−3cos(3x)", "3sin(3x)"], answer: 1, hint: "Chain rule: multiply by the inner derivative." },
  { topic: "Derivatives", difficulty: 2, q: "d/dx [x·eˣ]", choices: ["eˣ", "x·eˣ", "eˣ(x + 1)", "eˣ(x − 1)"], answer: 2, hint: "Product rule: f′g + fg′." },
  { topic: "Derivatives", difficulty: 3, q: "d/dx [ln(x² + 1)]", choices: ["1/(x² + 1)", "2x/(x² + 1)", "2x·ln(x)", "x/(x² + 1)"], answer: 1, hint: "d/dx ln(u) = u′/u." },
  { topic: "Integrals", difficulty: 1, q: "∫ 2x dx", choices: ["x² + C", "2x² + C", "x + C", "2 + C"], answer: 0, hint: "Reverse the power rule." },
  { topic: "Integrals", difficulty: 2, q: "∫₀¹ 3x² dx", choices: ["3", "1", "1/3", "0"], answer: 1, hint: "Antiderivative is x³; evaluate 0 to 1." },
  { topic: "Integrals", difficulty: 2, q: "∫ cos(x) dx", choices: ["−sin(x) + C", "sin(x) + C", "cos(x) + C", "−cos(x) + C"], answer: 1, hint: "Which function differentiates to cos(x)?" },
  { topic: "Integrals", difficulty: 3, q: "∫ 1/x dx", choices: ["x⁰ + C", "ln|x| + C", "−1/x² + C", "eˣ + C"], answer: 1, hint: "The power rule fails at n = −1." },
  { topic: "Applications", difficulty: 2, q: "Slope of y = x² at x = 4?", choices: ["4", "8", "16", "2"], answer: 1, hint: "Slope = derivative at that point." },
  { topic: "Applications", difficulty: 3, q: "f(x) = x³ − 3x has a local max at x = ?", choices: ["1", "0", "−1", "3"], answer: 2, hint: "Set f′ = 0, then check sign of f″." },
  { topic: "Applications", difficulty: 3, q: "s(t) = t² + 2t. Velocity at t = 3?", choices: ["15", "8", "6", "9"], answer: 1, hint: "Velocity = s′(t)." },
];

// Gameplay rules
const LEVEL_XP = (lvl: number) => 100 * lvl; // XP needed to go from lvl to lvl+1
const calcPoints = (difficulty: number, streak: number, usedHint: boolean) => {
  const base = difficulty * 10;
  const mult = 1 + Math.min(streak, 10) * 0.1; // up to 2x at 10-streak
  return Math.round(base * mult * (usedHint ? 0.5 : 1));
};

interface Save { xp: number; level: number; total: number; streak: number; best: number; solved: number; attempts: number }
const EMPTY: Save = { xp: 0, level: 1, total: 0, streak: 0, best: 0, solved: 0, attempts: 0 };
const KEY = "limit-break-save";

function shuffle<T>(a: T[]) { return [...a].sort(() => Math.random() - 0.5); }

function Game() {
  const [save, setSave] = useState<Save>(EMPTY);
  const [topic, setTopic] = useState<Topic | "All">("All");
  const [queue, setQueue] = useState<Problem[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setSave({ ...EMPTY, ...JSON.parse(s) }); } catch { /* ignore */ }
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(save)); }, [save]);

  const pool = useMemo(() => PROBLEMS.filter((p) => topic === "All" || p.topic === topic), [topic]);
  useEffect(() => { setQueue(shuffle(pool)); setPicked(null); setHint(false); }, [pool]);

  const current = queue[0];
  const answered = picked !== null;
  const correct = answered && current && picked === current.answer;

  function choose(i: number) {
    if (answered || !current) return;
    setPicked(i);
    setSave((s) => {
      const ok = i === current.answer;
      if (!ok) return { ...s, streak: 0, attempts: s.attempts + 1 };
      const streak = s.streak + 1;
      const pts = calcPoints(current.difficulty, s.streak, hint);
      let xp = s.xp + pts, level = s.level;
      while (xp >= LEVEL_XP(level)) { xp -= LEVEL_XP(level); level++; }
      if (level > s.level) setToast(`Level ${level}!`);
      else setToast(`+${pts}`);
      setTimeout(() => setToast(null), 1400);
      return { ...s, xp, level, total: s.total + pts, streak, best: Math.max(s.best, streak), solved: s.solved + 1, attempts: s.attempts + 1 };
    });
  }

  function next() {
    setQueue((q) => (q.length > 1 ? q.slice(1) : shuffle(pool)));
    setPicked(null); setHint(false);
  }

  const pct = Math.round((save.xp / LEVEL_XP(save.level)) * 100);
  const accuracy = save.attempts ? Math.round((save.solved / save.attempts) * 100) : 0;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Calculus 1 · Practice</p>
          <h1 className="text-6xl font-black leading-none md:text-7xl">Limit <em className="text-accent">Break</em></h1>
        </div>
        <button onClick={() => confirm("Reset all progress?") && setSave(EMPTY)} className="text-xs text-muted-foreground underline">
          reset progress
        </button>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Level" value={save.level} />
        <Stat label="Points" value={save.total} />
        <Stat label="Streak" value={`${save.streak}${save.streak >= 3 ? " 🔥" : ""}`} hot={save.streak >= 3} />
        <Stat label="Accuracy" value={`${accuracy}%`} sub={`best streak ${save.best}`} />
      </section>

      <div className="mt-4 border-2 border-border bg-card">
        <div className="h-3 bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-right text-xs text-muted-foreground">{save.xp} / {LEVEL_XP(save.level)} XP to level {save.level + 1}</p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {(["All", "Limits", "Derivatives", "Integrals", "Applications"] as const).map((t) => (
          <button key={t} onClick={() => setTopic(t)}
            className={`border-2 border-border px-3 py-1 text-sm transition ${topic === t ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}>
            {t}
          </button>
        ))}
      </nav>

      {current && (
        <article key={current.q} className="relative mt-6 border-2 border-border bg-card p-6 ink-shadow-lg md:p-10 animate-in fade-in slide-in-from-bottom-2">
          {toast && <span className="absolute -top-5 right-6 bg-accent px-3 py-1 font-bold text-accent-foreground animate-in zoom-in">{toast}</span>}
          <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground">
            <span>{current.topic}</span>
            <span>{"★".repeat(current.difficulty)}{"☆".repeat(3 - current.difficulty)} · {calcPoints(current.difficulty, save.streak, hint)} pts</span>
          </div>
          <h2 className="mt-6 text-3xl font-semibold italic md:text-5xl">{current.q}</h2>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {current.choices.map((c, i) => {
              const state = !answered ? "bg-background hover:-translate-y-0.5 hover:ink-shadow"
                : i === current.answer ? "bg-success text-primary-foreground"
                : i === picked ? "bg-destructive text-destructive-foreground" : "bg-background opacity-50";
              return (
                <button key={i} disabled={answered} onClick={() => choose(i)}
                  className={`border-2 border-border p-4 text-left text-lg transition ${state}`}>
                  <span className="mr-3 text-muted-foreground">{String.fromCharCode(65 + i)}</span>{c}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {!answered ? (
              <button onClick={() => setHint(true)} disabled={hint} className="text-sm underline disabled:no-underline">
                {hint ? `Hint: ${current.hint}` : "Need a hint? (halves points)"}
              </button>
            ) : (
              <p className="text-sm">{correct ? "Correct — keep the streak going." : `Not quite. ${current.hint}`}</p>
            )}
            {answered && (
              <button onClick={next} className="border-2 border-border bg-primary px-6 py-2 font-bold text-primary-foreground ink-shadow transition hover:translate-x-0.5 hover:translate-y-0.5">
                Next →
              </button>
            )}
          </div>
        </article>
      )}

      <footer className="mt-10 text-xs text-muted-foreground">
        Points = difficulty × 10 × (1 + 0.1 per streak, max 2×). Hints halve points. Wrong answer resets streak.
      </footer>
    </main>
  );
}

function Stat({ label, value, sub, hot }: { label: string; value: string | number; sub?: string; hot?: boolean }) {
  return (
    <div className={`border-2 border-border p-4 ink-shadow ${hot ? "bg-flame text-primary-foreground" : "bg-card"}`}>
      <p className="text-xs uppercase tracking-widest opacity-70">{label}</p>
      <p className="font-display text-3xl font-black">{value}</p>
      {sub && <p className="text-xs opacity-70">{sub}</p>}
    </div>
  );
}
