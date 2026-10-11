import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function InlineMath({ math }: { math: string }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { throwOnError: false }) }} />;
}

function BlockMath({ math }: { math: string }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(math, { displayMode: true, throwOnError: false }) }} />;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Limit Break: Calculus 1 Practice Game" },
      { name: "description", content: "Solve calculus problems, build streaks, and level up." },
    ],
  }),
  component: Game,
});

type Topic = "Limits" | "Derivatives" | "Integrals" | "Applications" | "Diff Eq";
type TopicFilter = Topic | "All";

interface MathQuestion {
  id: number;
  topic: Topic;
  difficulty: 1 | 2 | 3;
  reference: string;
  story: string;
  question_latex: string;
  image_url: string;
  choices: string[];
  correct_answer_index: number;
  hints: string[];
  steps: string[];
}

interface Save {
  xp: number;
  level: number;
  total: number;
  streak: number;
  best: number;
  solved: number;
  attempts: number;
  hearts: number;
}

const MAX_HEARTS = 8;
const EMPTY: Save = { xp: 0, level: 1, total: 0, streak: 0, best: 0, solved: 0, attempts: 0, hearts: MAX_HEARTS };
const TOPICS: TopicFilter[] = ["All", "Limits", "Derivatives", "Integrals", "Applications", "Diff Eq"];
const UNLOCK_LEVEL: Record<Topic, number> = {
  Limits: 1,
  Derivatives: 4,
  Integrals: 7,
  Applications: 10,
  "Diff Eq": 13,
};
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const API_ORIGIN = new URL(API_URL).origin;

function levelXp(level: number) {
  return 100 * level;
}

function calcPoints(difficulty: number, streak: number, hint: number) {
  return Math.round(difficulty * 10 * Math.min(2, 1 + streak * 0.1) * (hint === 0 ? 1 : hint === 1 ? 0.75 : 0.5));
}

function cleanMathText(value: string) {
  return value.replace(/\[cite:\s*\d+\]/gi, "").trim();
}

function normalizeLatex(value: string) {
  return value
    .replace(/\\\\(?=\\?[A-Za-z])/g, "\\")
    .replace(/&\s*,/g, "& ")
    .replace(/&\s*;/g, "& ")
    .replace(/\\ge(?![A-Za-z])/g, "\\geq")
    .replace(/\\le(?![A-Za-z])/g, "\\leq")
    .replace(/\\frac\s*([A-Za-z0-9])\s*\\sqrt\s*(\{[^{}]*\})/g, "\\frac{$1}{\\sqrt$2}")
    .replace(/\\frac\s*([A-Za-z0-9])\s*([A-Za-z0-9])/g, "\\frac{$1}{$2}")
    .replace(/~/g, " ");
}

function MathContent({ value, block = false }: { value: string; block?: boolean }) {
  const cleaned = cleanMathText(value);
  const firstDollar = cleaned.indexOf("$");
  const lastDollar = cleaned.lastIndexOf("$");
  if (cleaned.includes("\\begin{cases}") && firstDollar >= 0 && lastDollar > firstDollar) {
    const prefix = cleaned.slice(0, firstDollar);
    const math = normalizeLatex(cleaned.slice(firstDollar + 1, lastDollar));
    const suffix = cleaned.slice(lastDollar + 1);
    const casesStart = math.indexOf("\\begin{cases}");
    const casesEnd = math.indexOf("\\end{cases}", casesStart);
    const beforeCases = math.slice(0, casesStart);
    const rows = math.slice(casesStart + "\\begin{cases}".length, casesEnd).split(/\\\\/).filter(Boolean);
    return <>{prefix && <span>{prefix}</span>}{beforeCases && <InlineMath math={beforeCases} />}
      <span className="mx-1 inline-flex items-center align-middle">
        <span className="mr-1 text-3xl leading-none" aria-hidden="true">{"{"}</span>
        <span className="inline-flex flex-col gap-1">
          {rows.map((row, index) => {
            const [expression, condition = ""] = row.split("&");
            return <span key={index} className="inline-flex items-center gap-3 whitespace-nowrap">
              <InlineMath math={expression.trim()} />
              {condition.trim() && <InlineMath math={condition.trim()} />}
            </span>;
          })}
        </span>
      </span>
      {suffix && <span>{suffix}</span>}</>;
  }

  const tokenPattern = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\begin\{([A-Za-z*]+)\}[\s\S]*?\\end\{\2\})/g;
  const isLikelyMath = /\\[A-Za-z]+/.test(cleaned) || /[A-Za-z]\^|[{}]|[=^_]/.test(cleaned);
  const parts: Array<{ text: string; math: boolean }> = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(cleaned)) !== null) {
    if (match.index > cursor) parts.push({ text: cleaned.slice(cursor, match.index), math: false });
    const token = match[0];
    const math = token.startsWith("$")
      ? token.startsWith("$$") ? token.slice(2, -2) : token.slice(1, -1)
      : token;
    parts.push({ text: normalizeLatex(math), math: true });
    cursor = match.index + token.length;
  }

  if (cursor < cleaned.length) parts.push({ text: cleaned.slice(cursor), math: false });
  if (!parts.some((part) => part.math)) {
    return isLikelyMath ? <InlineMath math={normalizeLatex(cleaned)} /> : <span>{cleaned}</span>;
  }

  return <>{parts.map((part, index) => part.math
    ? block ? <BlockMath key={index} math={part.text} /> : <InlineMath key={index} math={part.text} />
    : <span key={index}>{part.text}</span>)}</>;
}

function MathBlock({ value }: { value: string }) {
  return <MathContent value={value} block />;
}

function Game() {
  const [save, setSave] = useState<Save>(EMPTY);
  const [topic, setTopic] = useState<TopicFilter>("All");
  const [current, setCurrent] = useState<MathQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionNonce, setQuestionNonce] = useState(0);
  const [saveLoaded, setSaveLoaded] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("limit-break-save");
      if (stored) {
        const parsed = { ...EMPTY, ...JSON.parse(stored) };
        setSave({ ...parsed, hearts: Math.max(0, Math.min(MAX_HEARTS, Number(parsed.hearts))) });
      }
    } catch {
      setError("โหลดความคืบหน้าเดิมไม่สำเร็จ แต่ยังเล่นต่อได้");
    } finally {
      setSaveLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!saveLoaded) return;
    localStorage.setItem("limit-break-save", JSON.stringify(save));
  }, [save, saveLoaded]);

  useEffect(() => {
    if (localStorage.getItem("limit-break-source-seen") === "true") return;
    setShowSourceModal(true);
  }, []);

  useEffect(() => {
    if (!showSourceModal) return;
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeSourceModal();
    }
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [showSourceModal]);

  useEffect(() => {
    let cancelled = false;
    async function loadQuestion() {
      setLoading(true);
      setError(null);
      setCurrent(null);
      setPicked(null);
      setHint(0);
      try {
        const response = await fetch(`${API_URL}/questions/?topic=${encodeURIComponent(topic)}`);
        if (!response.ok) throw new Error(`Question API returned ${response.status}`);
        const question = (await response.json()) as MathQuestion;
        if (!cancelled) setCurrent(question);
      } catch (cause) {
        console.error(cause);
        if (!cancelled) setError("ยังโหลดโจทย์ไม่ได้ ตรวจสอบว่า Django API กำลังทำงานอยู่");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadQuestion();
    return () => {
      cancelled = true;
    };
  }, [topic, questionNonce]);

  const answered = picked !== null;
  const correct = Boolean(current && answered && picked === current.correct_answer_index);
  const pct = Math.round((save.xp / levelXp(save.level)) * 100);
  const accuracy = save.attempts ? Math.round((save.solved / save.attempts) * 100) : 0;
  const availableTopics = useMemo(() => TOPICS.filter((item) => item === "All" || save.level >= UNLOCK_LEVEL[item]), [save.level]);

  function choose(index: number) {
    if (answered || !current || save.hearts <= 0) return;
    setPicked(index);
    setSave((previous) => {
      const isCorrect = index === current.correct_answer_index;
      if (!isCorrect) return { ...previous, hearts: Math.max(0, previous.hearts - 1), streak: 0, attempts: previous.attempts + 1 };
      const streak = previous.streak + 1;
      const points = calcPoints(current.difficulty, previous.streak, hint);
      let xp = previous.xp + points;
      let level = previous.level;
      while (xp >= levelXp(level)) {
        xp -= levelXp(level);
        level += 1;
      }
      setToast(level > previous.level ? `Level ${level}!` : `+${points}`);
      window.setTimeout(() => setToast(null), 1400);
      return { ...previous, xp, level, total: previous.total + points, streak, best: Math.max(previous.best, streak), solved: previous.solved + 1, attempts: previous.attempts + 1 };
    });
  }

  function resetProgress() {
    if (window.confirm("Reset all progress?")) setSave(EMPTY);
  }

  function restoreDemoHearts() {
    setSave((previous) => ({ ...previous, hearts: MAX_HEARTS }));
    setPicked(null);
    setQuestionNonce((value) => value + 1);
  }

  function closeSourceModal() {
    localStorage.setItem("limit-break-source-seen", "true");
    setShowSourceModal(false);
  }

  return (
    <main className="game-shell relative mx-auto max-w-5xl overflow-hidden px-5 py-10">
      <span aria-hidden className="pointer-events-none absolute -left-4 top-24 text-5xl animate-floaty">☁️</span>
      <span aria-hidden className="pointer-events-none absolute right-2 top-40 text-4xl animate-floaty">☁️</span>
      <span aria-hidden className="pointer-events-none absolute left-1/3 top-6 text-3xl animate-wiggle">⭐</span>

      <header className="game-header relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">🎓 CALCULUS 1 / FLIGHT SCHOOL</p>
          <h1 className="mt-3 text-6xl font-extrabold leading-none md:text-7xl">Limit <em className="not-italic text-accent">Break</em> <span className="inline-block animate-wiggle">🚀</span></h1>
          <p className="mt-3 max-w-md text-base font-bold text-muted-foreground">ฝึกคิดทีละด่าน แล้วปล่อยให้ความแม่นยำพาคุณขึ้นวงโคจร</p>
        </div>
        <button type="button" onClick={resetProgress} className="min-h-11 rounded-full bg-muted px-4 py-2 text-xs font-bold text-muted-foreground transition hover:scale-105">🗑️ reset progress</button>
      </header>

      <section className="stats-grid relative mt-8 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Your progress">
        <Stat emoji="🏆" label="Level" value={save.level} />
        <Stat emoji="💎" label="Points" value={save.total} />
        <Stat emoji="🔥" label="Streak" value={save.streak} hot={save.streak >= 3} />
        <Stat emoji="🎯" label="Accuracy" value={`${accuracy}%`} sub={`best streak ${save.best}`} />
      </section>
      <div className="mt-4 flex items-center justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 font-bold ink-shadow" aria-label={`Hearts remaining: ${save.hearts} of ${MAX_HEARTS}`}>
        <span>❤️ หัวใจสำหรับตอบผิด</span>
        <span aria-live="polite" className="text-lg tracking-wide">{"❤️".repeat(save.hearts)}{"🖤".repeat(MAX_HEARTS - save.hearts)}</span>
      </div>

      <div className="progress-panel relative mt-5">
        <div className="relative h-5 overflow-hidden rounded-full border-2 border-border bg-card ink-shadow" role="progressbar" aria-label={`Level ${save.level} progress`} aria-valuemin={0} aria-valuemax={levelXp(save.level)} aria-valuenow={save.xp}>
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-right text-xs font-bold text-muted-foreground">{save.xp} / {levelXp(save.level)} XP to level {save.level + 1} ✨</p>
      </div>

      <nav className="topic-nav relative mt-8 flex flex-wrap gap-2" aria-label="Choose a calculus topic">
        {TOPICS.map((item) => {
          const locked = item !== "All" && !availableTopics.includes(item);
          return (
            <button key={item} type="button" aria-pressed={topic === item} aria-disabled={locked} disabled={locked} onClick={() => setTopic(item)} className={`min-h-11 rounded-full border-2 border-border px-4 py-1.5 text-sm font-bold transition ${topic === item ? "bg-primary text-primary-foreground ink-shadow" : "bg-card hover:bg-secondary"} ${locked ? "cursor-not-allowed opacity-45" : "hover:scale-105 active:scale-95"}`}>
              {locked ? "🔒 " : ""}{item}{locked ? ` · Lv.${UNLOCK_LEVEL[item as Topic]}` : ""}
            </button>
          );
        })}
      </nav>

      {loading && <section className="mission-card mt-6 rounded-4xl border-2 border-border bg-card p-8 text-center font-bold" aria-live="polite">กำลังรับภารกิจจากศูนย์ควบคุม...</section>}
      {!loading && error && <section className="mission-card mt-6 rounded-4xl border-2 border-border bg-card p-8 text-center font-bold text-destructive" role="alert">{error}</section>}
      {!loading && !error && current && (
        <article className="mission-card relative mt-6 rounded-4xl border-2 border-border bg-card p-6 ink-shadow-lg md:p-10">
          {toast && <span className="absolute -top-5 right-6 rounded-full bg-sun px-4 py-1.5 font-display text-lg font-bold">{toast}</span>}
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">{current.topic}</span>
            <span className="text-base normal-case tracking-normal">{"⭐".repeat(current.difficulty)} · {calcPoints(current.difficulty, save.streak, hint)} pts</span>
          </div>
          <p className="mt-2 text-xs font-bold text-muted-foreground">📘 {cleanMathText(current.reference)}</p>
          <p className="story-panel mt-5 rounded-3xl bg-secondary p-4 text-base font-bold text-secondary-foreground">{current.story}</p>
          {current.image_url && <img src={`${API_ORIGIN}${current.image_url}`} alt="ภาพประกอบโจทย์คณิตศาสตร์" className="mt-5 max-h-96 w-full rounded-2xl border-2 border-border object-contain" />}
          <div className="mt-5 rounded-2xl bg-background p-4 text-base leading-8"><MathContent value={current.question_latex} /></div>

          <div className="choice-grid mt-8 grid gap-3 sm:grid-cols-2">
            {current.choices.map((choice, index) => {
              const state = !answered ? "bg-background hover:-translate-y-1 hover:ink-shadow hover:bg-secondary" : index === current.correct_answer_index ? "bg-success text-primary-foreground ink-shadow" : index === picked ? "bg-destructive text-destructive-foreground" : "bg-background opacity-50";
              return <button key={index} type="button" disabled={answered} onClick={() => choose(index)} className={`rounded-3xl border-2 border-border p-4 text-left text-lg font-bold transition active:scale-95 ${state}`}><span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">{String.fromCharCode(65 + index)}</span><span className="inline-block align-middle"><MathContent value={choice} /></span></button>;
            })}
          </div>

          {hint > 0 && <div className="mt-6 space-y-2">{current.hints.slice(0, hint).map((item, index) => <p key={index} className="rounded-2xl bg-sun/40 px-4 py-2 text-sm font-bold">💡 คำใบ้ระดับ {index + 1}: {item}</p>)}</div>}
          {answered && <div className="solution-panel mt-6 rounded-3xl border-2 border-border bg-background p-5"><p className="font-display text-lg font-bold">{correct ? "🎉 ถูกต้อง!" : "💪 ยังไม่ถูก: ดูวิธีทำกัน"}</p><p className="mt-1 text-sm font-bold">📝 วิธีทำทีละขั้นตอน</p><ol className="mt-2 space-y-1.5">{current.steps.map((step, index) => <li key={index} className="flex gap-3 text-sm"><span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span><span className="min-w-0 flex-1"><MathBlock value={step} /></span></li>)}</ol><p className="mt-3 text-sm font-bold">✅ คำตอบ</p><MathBlock value={current.choices[current.correct_answer_index]} /></div>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {!answered ? <button type="button" onClick={() => setHint((value) => Math.min(2, value + 1))} disabled={hint >= 2 || save.hearts <= 0} className="min-h-11 rounded-full bg-sun/40 px-4 py-2 text-sm font-bold transition hover:scale-105 disabled:opacity-50">{hint === 0 ? "💡 ขอคำใบ้ระดับ 1 (−25% แต้ม)" : "💡 ขอคำใบ้ระดับ 2 (−50% แต้ม)"}</button> : <span />}
            {answered && save.hearts > 0 && <button type="button" onClick={() => setQuestionNonce((value) => value + 1)} className="min-h-11 rounded-full border-2 border-border bg-primary px-8 py-2.5 font-display text-lg font-bold text-primary-foreground ink-shadow transition hover:translate-y-1">ข้อต่อไป</button>}
          </div>
        </article>
      )}
      {answered && save.hearts === 0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/35 p-5" role="dialog" aria-modal="true" aria-labelledby="hearts-empty-title">
          <div className="w-full max-w-md rounded-4xl border-2 border-border bg-card p-7 text-center ink-shadow-lg">
            <p className="text-5xl" aria-hidden="true">💔</p>
            <h2 id="hearts-empty-title" className="mt-3 font-display text-2xl font-bold">หัวใจหมดแล้ว</h2>
            <p className="mt-2 font-bold text-muted-foreground">ตอบผิดครบ {MAX_HEARTS} ครั้งแล้ว หากต้องการเล่นต่อจะต้องชำระเงิน</p>
            <p className="mt-3 rounded-2xl bg-secondary p-3 text-sm font-bold text-secondary-foreground">โหมดจำลอง: ยังไม่ได้เชื่อมต่อระบบชำระเงินจริง</p>
            <button type="button" onClick={restoreDemoHearts} className="mt-5 min-h-11 rounded-full border-2 border-border bg-primary px-6 py-2.5 font-display font-bold text-primary-foreground ink-shadow transition hover:translate-y-1">รับหัวใจทดลอง 8 ดวง</button>
          </div>
        </div>
      )}
{showSourceModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/35 p-5" role="dialog" aria-modal="true" aria-labelledby="source-modal-title">
          <div className="w-full max-w-lg rounded-4xl border-2 border-border bg-card p-7 ink-shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">ก่อนเริ่มภารกิจ</p>
                <h2 id="source-modal-title" className="mt-2 font-display text-2xl font-bold">ข้อสอบมาจากที่ไหน?</h2>
              </div>
              <button type="button" onClick={closeSourceModal} aria-label="ปิดข้อมูลแหล่งที่มา" className="min-h-11 min-w-11 rounded-full border-2 border-border bg-muted text-xl font-bold transition hover:scale-105">×</button>
            </div>
            <p className="mt-4 font-bold text-muted-foreground">เนื้อหาทั้งหมดจัดทำขึ้นเพื่อการศึกษาและไม่แสวงหาผลกำไร โดยไม่มีเจตนาละเมิดลิขสิทธิ์ ทั้งนี้ หากท่านพอมีเวลา เราขอเชิญชวนให้เข้าไปศึกษาเนื้อหาฉบับเต็มจากแหล่งข้อมูลต้นฉบับ เพื่อต่อยอดความรู้ให้สมบูรณ์ยิ่งขึ้น</p>
            
            <div className="mt-5 rounded-3xl border-2 border-border bg-secondary p-5 text-left">
              <p className="text-sm font-bold text-muted-foreground mb-4">แหล่งอ้างอิงและชุดข้อสอบ</p>
              <ul className="flex flex-col gap-4">
                <li>
                  <div className="font-display text-lg font-bold text-primary flex items-center gap-2">
                    📘 Thomas' Calculus: Early Transcendentals (13th Edition)
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">George B. Thomas, Jr., Maurice D. Weir, Joel Hass (Pearson)</p>
                </li>
                <li>
                  <a href="https://tutorial.math.lamar.edu/" target="_blank" rel="noopener noreferrer" className="font-display text-lg font-bold text-primary hover:underline flex items-center gap-2">
                    🔗 Paul's Online Math Notes
                  </a>
                  <p className="text-sm font-bold text-muted-foreground">tutorial.math.lamar.edu</p>
                </li>
                <li>
                  <a href="https://math.libretexts.org/" target="_blank" rel="noopener noreferrer" className="font-display text-lg font-bold text-primary hover:underline flex items-center gap-2">
                    🔗 Calculus (Gilbert Strang & Edwin Herman)
                  </a>
                  <p className="text-sm font-bold text-muted-foreground">LibreTexts™ (math.libretexts.org)</p>
                </li>
                <li>
                  <a href="https://math.science.cmu.ac.th/206111/" target="_blank" rel="noopener noreferrer" className="font-display text-lg font-bold text-primary hover:underline flex items-center gap-2">
                    🔗 206111 : Calculus 1
                  </a>
                  <p className="text-sm font-bold text-muted-foreground">ภาควิชาคณิตศาสตร์ มหาวิทยาลัยเชียงใหม่ (math.science.cmu.ac.th)</p>
                </li>
              </ul>
            </div>

            <button type="button" onClick={closeSourceModal} className="mt-6 min-h-11 w-full rounded-full border-2 border-border bg-primary px-6 py-2.5 font-display font-bold text-primary-foreground ink-shadow transition hover:translate-y-1">เข้าสู่ห้องฝึกบิน</button>
          </div>
        </div>
      )}
      

      <footer className="game-footer relative mt-10 text-center text-xs font-bold text-muted-foreground">🌈 Points = difficulty × 10 × (1 + 0.1 per streak, max 2×). Hint level 1 = 75% points, level 2 = 50%.</footer>
    </main>
  );
}

function Stat({ emoji, label, value, sub, hot }: { emoji: string; label: string; value: string | number; sub?: string; hot?: boolean }) {
  return <div className={`stat-card rounded-3xl border-2 border-border p-4 ink-shadow transition hover:-translate-y-1 ${hot ? "bg-flame text-primary-foreground" : "bg-card"}`}><p className="text-xs font-bold uppercase tracking-widest opacity-70">{emoji} {label}</p><p className="font-display text-3xl font-extrabold">{value}</p>{sub && <p className="text-xs font-bold opacity-70">{sub}</p>}</div>;
}
