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

type Topic = "Limits" | "Derivatives" | "Integrals" | "Applications" | "Diff Eq";
interface Problem {
  topic: Topic;
  difficulty: 1 | 2 | 3;
  ref: string; // Thomas' Calculus 13e section
  story: string;
  q: string;
  choices: string[];
  answer: number;
  hints: [string, string];
  steps: string[];
}

const PROBLEMS: Problem[] = [
  { topic: "Limits", difficulty: 2, ref: "§2.2 Limit Laws",
    story: "🛡️ เกราะพลังงานของยานเริ่มชาร์จ พลังงานเฉลี่ยในช่วงเวลา t วินาทีแรกคือ E(t) = (√(t+9) − 3)/t",
    q: "หาค่า lim t→0 E(t) เพื่อรู้พลังงานเริ่มต้นของเกราะ", choices: ["0", "1/6", "1/3", "หาค่าไม่ได้"], answer: 1,
    hints: ["แทน t = 0 ตรงๆ จะได้ 0/0 ซึ่งเป็นรูปแบบไม่กำหนด — ต้องจัดรูปก่อนใช้ Limit Laws", "คูณเศษและส่วนด้วยสังยุค (√(t+9) + 3) เพื่อกำจัดตัวส่วนที่เป็นศูนย์"],
    steps: ["แทน t = 0: (√9 − 3)/0 = 0/0 → รูปแบบไม่กำหนด", "คูณด้วยสังยุค: (√(t+9) − 3)(√(t+9) + 3) / [t(√(t+9) + 3)] = t / [t(√(t+9) + 3)]", "ตัด t (เพราะ t ≠ 0 ขณะเข้าใกล้): = 1/(√(t+9) + 3)", "ใช้ Limit Laws แทน t = 0: 1/(3 + 3) = 1/6"] },
  { topic: "Limits", difficulty: 2, ref: "§2.4 Theorem 7: lim sinθ/θ = 1",
    story: "📡 เรดาร์ของยานรับสัญญาณ S(x) = sin(5x)/(3x) เมื่อมุมสแกน x เข้าใกล้ 0",
    q: "หาค่า lim x→0 sin(5x)/(3x)", choices: ["1", "5/3", "3/5", "0"], answer: 1,
    hints: ["ทฤษฎีบท 7 (§2.4): lim θ→0 (sin θ)/θ = 1 (θ เป็นเรเดียน)", "เขียนใหม่เป็น (5/3)·[sin(5x)/(5x)] แล้วให้ θ = 5x"],
    steps: ["จัดรูป: sin(5x)/(3x) = (5/3)·sin(5x)/(5x)", "ให้ θ = 5x เมื่อ x→0 จะได้ θ→0", "ตามทฤษฎีบท 7: lim sin θ/θ = 1", "คำตอบ: (5/3)(1) = 5/3"] },
  { topic: "Limits", difficulty: 3, ref: "§2.6 Limits at Infinity",
    story: "🛸 โดรนสำรวจดาวเคราะห์น้อยมีความเร็ว v(t) = (6t² + 5t)/(2t² − 1) กม./วินาที",
    q: "ความเร็วปลายทาง (terminal speed) lim t→∞ v(t) เท่ากับเท่าใด", choices: ["3", "6", "∞", "5/2"], answer: 0,
    hints: ["สำหรับฟังก์ชันตรรกยะเมื่อ t→∞ ให้หารด้วยกำลังสูงสุดของตัวส่วน", "หารทุกพจน์ด้วย t² แล้วใช้ lim 1/t = 0"],
    steps: ["หารเศษและส่วนด้วย t²: (6 + 5/t)/(2 − 1/t²)", "เมื่อ t→∞: 5/t → 0 และ 1/t² → 0", "lim = (6 + 0)/(2 − 0) = 3 กม./วินาที"] },
  { topic: "Limits", difficulty: 3, ref: "§4.5 L'Hôpital's Rule",
    story: "⚛️ เครื่องปฏิกรณ์ของยานมีค่าความคลาดเคลื่อน R(x) = (eˣ − 1 − x)/x²",
    q: "หาค่า lim x→0 R(x)", choices: ["0", "1", "1/2", "∞"], answer: 2,
    hints: ["รูปแบบเป็น 0/0 → ใช้ทฤษฎีบทของโลปิตาล (L'Hôpital's Rule)", "อาจต้องใช้โลปิตาลซ้ำสองครั้ง เพราะครั้งแรกยังได้ 0/0"],
    steps: ["แทน x = 0: (1 − 1 − 0)/0 = 0/0", "โลปิตาลครั้งที่ 1: (eˣ − 1)/(2x) → ยังเป็น 0/0", "โลปิตาลครั้งที่ 2: eˣ/2", "แทน x = 0: e⁰/2 = 1/2"] },
  { topic: "Derivatives", difficulty: 2, ref: "§3.6 Chain Rule + §3.3 Product Rule",
    story: "🔦 ความเข้มเลเซอร์ของยานคือ I(t) = e^(−t²)·sin(2t)",
    q: "อัตราการเปลี่ยนความเข้ม I′(0) เท่ากับเท่าใด", choices: ["0", "1", "2", "−2"], answer: 2,
    hints: ["I(t) เป็นผลคูณของสองฟังก์ชัน → ใช้ Product Rule: (uv)′ = u′v + uv′", "หา u′ = −2t·e^(−t²) และ v′ = 2cos(2t) ด้วย Chain Rule"],
    steps: ["u = e^(−t²) → u′ = −2t·e^(−t²) (Chain Rule)", "v = sin(2t) → v′ = 2cos(2t) (Chain Rule)", "I′(t) = −2t·e^(−t²)sin(2t) + 2e^(−t²)cos(2t)", "I′(0) = 0 + 2·1·1 = 2"] },
  { topic: "Derivatives", difficulty: 3, ref: "§3.7 Implicit Differentiation",
    story: "🪐 ยานโคจรตามเส้นทาง x² + xy + y² = 7 และขณะนี้อยู่ที่จุด (1, 2)",
    q: "ความชันของวงโคจร dy/dx ที่จุด (1, 2)", choices: ["−4/5", "4/5", "−5/4", "−1/2"], answer: 0,
    hints: ["ใช้การหาอนุพันธ์โดยปริยาย: หาอนุพันธ์ทั้งสองข้างเทียบกับ x โดยมอง y เป็นฟังก์ชันของ x", "อย่าลืม Product Rule กับพจน์ xy: d/dx(xy) = y + x·y′"],
    steps: ["d/dx: 2x + (y + x·y′) + 2y·y′ = 0", "จัด y′: y′(x + 2y) = −(2x + y)", "y′ = −(2x + y)/(x + 2y)", "ที่ (1,2): y′ = −(2 + 2)/(1 + 4) = −4/5"] },
  { topic: "Applications", difficulty: 2, ref: "§3.10 Related Rates",
    story: "🫧 เกราะทรงกลมขยายตัว รัศมีเพิ่มขึ้น 2 ม./วินาที",
    q: "ขณะรัศมี r = 5 ม. ปริมาตรเกราะเพิ่มขึ้นด้วยอัตรา dV/dt เท่าใด", choices: ["100π ม³/วิ", "200π ม³/วิ", "50π ม³/วิ", "500π/3 ม³/วิ"], answer: 1,
    hints: ["เขียนสมการเชื่อมตัวแปร: V = (4/3)πr³ แล้วหาอนุพันธ์เทียบกับเวลา t", "Chain Rule: dV/dt = 4πr²·(dr/dt)"],
    steps: ["V = (4/3)πr³", "หาอนุพันธ์เทียบกับ t: dV/dt = 4πr²·dr/dt", "แทน r = 5, dr/dt = 2: 4π(25)(2)", "dV/dt = 200π ม³/วินาที"] },
  { topic: "Applications", difficulty: 3, ref: "§4.6 Applied Optimization",
    story: "🧱 สร้างกำแพงพลังงานรูปสี่เหลี่ยมผืนผ้าติดหน้าผา (ไม่ต้องสร้างด้านหน้าผา) มีวัสดุ 400 ม.",
    q: "พื้นที่ฐานทัพที่มากที่สุดเป็นเท่าใด", choices: ["10,000 ม²", "20,000 ม²", "40,000 ม²", "15,000 ม²"], answer: 1,
    hints: ["ให้ด้านตั้งฉากหน้าผายาว x จะได้ด้านขนาน = 400 − 2x → A(x) = x(400 − 2x)", "หาจุดวิกฤตจาก A′(x) = 0 แล้วตรวจด้วย Second Derivative Test"],
    steps: ["A(x) = 400x − 2x², โดเมน 0 ≤ x ≤ 200", "A′(x) = 400 − 4x = 0 → x = 100", "A″(x) = −4 < 0 → เป็นค่าสูงสุดสัมพัทธ์ (และที่ปลายช่วง A = 0)", "A(100) = 100 × 200 = 20,000 ม²"] },
  { topic: "Applications", difficulty: 2, ref: "§3.11 Linearization",
    story: "🧭 คอมพิวเตอร์นำทางต้องประมาณค่า √4.1 อย่างรวดเร็ว",
    q: "ใช้ Linearization ของ f(x) = √x ที่ a = 4 ประมาณ √4.1", choices: ["2.05", "2.025", "2.01", "2.1"], answer: 1,
    hints: ["Linearization: L(x) = f(a) + f′(a)(x − a)", "f′(x) = 1/(2√x) → f′(4) = 1/4"],
    steps: ["f(4) = 2, f′(4) = 1/(2·2) = 1/4", "L(x) = 2 + (1/4)(x − 4)", "L(4.1) = 2 + (1/4)(0.1) = 2.025"] },
  { topic: "Integrals", difficulty: 2, ref: "§5.6 Area Between Curves",
    story: "🛡️ แผ่นเกราะมีรูปร่างเป็นบริเวณระหว่างเส้นโค้ง y = x และ y = x²",
    q: "พื้นที่ของแผ่นเกราะ (ตารางหน่วย)", choices: ["1/2", "1/3", "1/6", "5/6"], answer: 2,
    hints: ["หาจุดตัดก่อน: x = x² → x = 0, 1", "Area = ∫ₐᵇ [f(x) − g(x)] dx โดย f คือเส้นบน (y = x บนช่วง [0,1])"],
    steps: ["จุดตัด: x² − x = 0 → x = 0, 1", "บน [0,1] มี x ≥ x²", "A = ∫₀¹ (x − x²) dx = [x²/2 − x³/3]₀¹", "A = 1/2 − 1/3 = 1/6"] },
  { topic: "Integrals", difficulty: 3, ref: "§5.5 Substitution Rule",
    story: "⛽ อัตราการใช้เชื้อเพลิงคือ r(t) = 2t(t² + 1)³ หน่วย/นาที",
    q: "เชื้อเพลิงที่ใช้ทั้งหมดในช่วง t = 0 ถึง 1 นาที", choices: ["15/4", "4", "17/4", "7/2"], answer: 0,
    hints: ["สังเกตว่า 2t คืออนุพันธ์ของ t² + 1 → ใช้กฎการแทนค่า", "ให้ u = t² + 1, du = 2t dt และเปลี่ยนขอบเขตเป็น u: 1 → 2"],
    steps: ["ให้ u = t² + 1 → du = 2t dt", "t = 0 → u = 1, t = 1 → u = 2", "∫₁² u³ du = [u⁴/4]₁²", "= 16/4 − 1/4 = 15/4"] },
  { topic: "Integrals", difficulty: 3, ref: "§5.4 Fundamental Theorem, Part 1",
    story: "🌀 พลังงานสะสมของวาร์ปไดรฟ์คือ W(x) = ∫₀^(x²) cos t dt",
    q: "หา W′(x)", choices: ["cos(x²)", "2x·cos(x²)", "sin(x²)", "2x·sin(x²)"], answer: 1,
    hints: ["FTC ภาค 1: d/dx ∫ₐ^x f(t) dt = f(x)", "ขอบเขตบนเป็น x² → ต้องใช้ Chain Rule คูณด้วย d(x²)/dx"],
    steps: ["ให้ u = x² → W = ∫₀^u cos t dt", "FTC ภาค 1: dW/du = cos u", "Chain Rule: dW/dx = cos(u)·du/dx = cos(x²)·2x", "W′(x) = 2x·cos(x²)"] },
  { topic: "Integrals", difficulty: 3, ref: "§6.1 Volumes by Disks",
    story: "🚀 หัวจรวดสร้างจากการหมุนเส้นโค้ง y = √x, 0 ≤ x ≤ 4 รอบแกน x",
    q: "ปริมาตรหัวจรวด", choices: ["8π", "16π", "4π", "32π/3"], answer: 0,
    hints: ["วิธีจาน (Disk Method): V = ∫ₐᵇ π[R(x)]² dx", "รัศมี R(x) = √x → [R(x)]² = x"],
    steps: ["V = ∫₀⁴ π(√x)² dx = π∫₀⁴ x dx", "= π[x²/2]₀⁴", "= π(16/2) = 8π ลูกบาศก์หน่วย"] },
  { topic: "Applications", difficulty: 2, ref: "§6.5 Work (Hooke's Law)",
    story: "🦾 สปริงของแขนกลต้องใช้แรง 10 N เพื่อยืด 0.5 ม.",
    q: "งานที่ใช้ยืดสปริงจากความยาวธรรมชาติไป 2 ม.", choices: ["20 J", "40 J", "80 J", "10 J"], answer: 1,
    hints: ["กฎของฮุก F(x) = kx → หา k จาก 10 = k(0.5)", "งาน W = ∫ₐᵇ F(x) dx"],
    steps: ["10 = k(0.5) → k = 20 N/m", "W = ∫₀² 20x dx = [10x²]₀²", "W = 40 J"] },
  { topic: "Diff Eq", difficulty: 2, ref: "§7.2 Exponential Change",
    story: "☢️ เชื้อเพลิงกัมมันตรังสี 100 กรัม สลายตัวตาม dy/dt = −0.1y (t เป็นชั่วโมง)",
    q: "เหลือเชื้อเพลิงเท่าใดเมื่อ t = 10 ชม.", choices: ["≈ 36.8 g", "≈ 90 g", "0 g", "≈ 50 g"], answer: 0,
    hints: ["สมการ dy/dt = ky มีผลเฉลย y = y₀e^(kt) (Law of Exponential Change)", "y₀ = 100, k = −0.1 → y(10) = 100e^(−1)"],
    steps: ["แยกตัวแปร: dy/y = −0.1 dt → ln|y| = −0.1t + C", "y = y₀e^(−0.1t), y₀ = 100", "y(10) = 100e^(−1) ≈ 100(0.3679)", "≈ 36.8 กรัม"] },
  { topic: "Diff Eq", difficulty: 3, ref: "§9.1 Separable Equations",
    story: "🌌 สนามแรงโน้มถ่วงทำให้ความสูงของยานเป็นไปตาม dy/dx = xy, y(0) = 2",
    q: "ผลเฉลยเฉพาะ y(x) คือข้อใด", choices: ["y = 2eˣ", "y = 2e^(x²/2)", "y = e^(x²) + 1", "y = 2 + x²/2"], answer: 1,
    hints: ["เป็นสมการแยกตัวแปรได้: ย้าย y ไปฝั่ง dy และ x ไปฝั่ง dx", "∫ dy/y = ∫ x dx → ln|y| = x²/2 + C แล้วใช้ y(0) = 2"],
    steps: ["แยกตัวแปร: dy/y = x dx", "อินทิเกรต: ln|y| = x²/2 + C", "y = Ae^(x²/2)", "y(0) = 2 → A = 2 → y = 2e^(x²/2)"] },
];

// Gameplay rules
const LEVEL_XP = (lvl: number) => 100 * lvl; // XP needed to go from lvl to lvl+1
const calcPoints = (difficulty: number, streak: number, hintsUsed: number) => {
  const base = difficulty * 10;
  const mult = 1 + Math.min(streak, 10) * 0.1; // up to 2x at 10-streak
  return Math.round(base * mult * (hintsUsed === 0 ? 1 : hintsUsed === 1 ? 0.75 : 0.5));
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
  const [hint, setHint] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setSave({ ...EMPTY, ...JSON.parse(s) }); } catch { /* ignore */ }
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(save)); }, [save]);

  const pool = useMemo(() => PROBLEMS.filter((p) => topic === "All" || p.topic === topic), [topic]);
  useEffect(() => { setQueue(shuffle(pool)); setPicked(null); setHint(0); }, [pool]);

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
    setPicked(null); setHint(0);
  }

  const pct = Math.round((save.xp / LEVEL_XP(save.level)) * 100);
  const accuracy = save.attempts ? Math.round((save.solved / save.attempts) * 100) : 0;

  return (
    <main className="relative mx-auto max-w-5xl overflow-hidden px-5 py-10">
      {/* floating 2D decorations */}
      <span aria-hidden className="pointer-events-none absolute -left-4 top-24 text-5xl animate-floaty">☁️</span>
      <span aria-hidden className="pointer-events-none absolute right-2 top-40 text-4xl animate-floaty" style={{ animationDelay: "1.2s" }}>☁️</span>
      <span aria-hidden className="pointer-events-none absolute left-1/3 top-6 text-3xl animate-wiggle">⭐</span>
      <span aria-hidden className="pointer-events-none absolute right-1/4 top-72 text-2xl animate-wiggle" style={{ animationDelay: "0.8s" }}>✨</span>

      <header className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-secondary-foreground">
            🎓 Calculus 1 · Practice
          </p>
          <h1 className="mt-3 text-6xl font-extrabold leading-none md:text-7xl">
            Limit <em className="not-italic text-accent">Break</em> <span className="inline-block animate-wiggle">🚀</span>
          </h1>
        </div>
        <button onClick={() => confirm("Reset all progress?") && setSave(EMPTY)} className="rounded-full bg-muted px-4 py-2 text-xs font-bold text-muted-foreground transition hover:scale-105">
          🗑️ reset progress
        </button>
      </header>

      <section className="relative mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat emoji="🏆" label="Level" value={save.level} />
        <Stat emoji="💎" label="Points" value={save.total} />
        <Stat emoji="🔥" label="Streak" value={save.streak} hot={save.streak >= 3} />
        <Stat emoji="🎯" label="Accuracy" value={`${accuracy}%`} sub={`best streak ${save.best}`} />
      </section>

      <div className="relative mt-5 h-5 overflow-hidden rounded-full border-2 border-border bg-card ink-shadow">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-right text-xs font-bold text-muted-foreground">{save.xp} / {LEVEL_XP(save.level)} XP to level {save.level + 1} ✨</p>

      <nav className="relative mt-8 flex flex-wrap gap-2">
        {(["All", "Limits", "Derivatives", "Integrals", "Applications", "Diff Eq"] as const).map((t) => (
          <button key={t} onClick={() => setTopic(t)}
            className={`rounded-full border-2 border-border px-4 py-1.5 text-sm font-bold transition hover:scale-105 active:scale-95 ${topic === t ? "bg-primary text-primary-foreground ink-shadow" : "bg-card hover:bg-secondary"}`}>
            {t}
          </button>
        ))}
      </nav>

      {current && (
        <article key={current.q} className="relative mt-6 rounded-4xl border-2 border-border bg-card p-6 ink-shadow-lg md:p-10 animate-in fade-in slide-in-from-bottom-2">
          {toast && <span className="absolute -top-5 right-6 rounded-full bg-sun px-4 py-1.5 font-display text-lg font-bold animate-in zoom-in">🎉 {toast}</span>}
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">{current.topic}</span>
            <span className="text-base normal-case tracking-normal">{"⭐".repeat(current.difficulty)} · {calcPoints(current.difficulty, save.streak, hint)} pts</span>
          </div>
          <p className="mt-2 text-xs font-bold text-muted-foreground">📘 Thomas' Calculus 13e · {current.ref}</p>
          <p className="mt-5 rounded-3xl bg-secondary p-4 text-base font-bold text-secondary-foreground">{current.story}</p>
          <h2 className="mt-5 text-2xl font-bold md:text-3xl">{current.q}</h2>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {current.choices.map((c, i) => {
              const state = !answered ? "bg-background hover:-translate-y-1 hover:ink-shadow hover:bg-secondary"
                : i === current.answer ? "bg-success text-primary-foreground ink-shadow"
                : i === picked ? "bg-destructive text-destructive-foreground" : "bg-background opacity-50";
              return (
                <button key={i} disabled={answered} onClick={() => choose(i)}
                  className={`rounded-3xl border-2 border-border p-4 text-left text-lg font-bold transition active:scale-95 ${state}`}>
                  <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">{String.fromCharCode(65 + i)}</span>{c}
                </button>
              );
            })}
          </div>

          {hint > 0 && (
            <div className="mt-6 space-y-2">
              {current.hints.slice(0, hint).map((h, i) => (
                <p key={i} className="rounded-2xl bg-sun/40 px-4 py-2 text-sm font-bold animate-in fade-in">💡 คำใบ้ระดับ {i + 1}: {h}</p>
              ))}
            </div>
          )}

          {answered && (
            <div className="mt-6 rounded-3xl border-2 border-border bg-background p-5 animate-in fade-in">
              <p className="font-display text-lg font-bold">{correct ? "🎉 ถูกต้อง!" : "💪 ยังไม่ถูก — ดูวิธีทำกัน"}</p>
              <p className="mt-1 text-sm font-bold">📝 วิธีทำทีละขั้นตอน</p>
              <ol className="mt-2 space-y-1.5">
                {current.steps.map((st, i) => (
                  <li key={i} className="flex gap-3 text-sm"><span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span><span>{st}</span></li>
                ))}
              </ol>
              <p className="mt-3 text-sm font-bold">✅ คำตอบ: {current.choices[current.answer]}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {!answered ? (
              <button onClick={() => setHint((h) => Math.min(2, h + 1))} disabled={hint >= 2} className="rounded-full bg-sun/40 px-4 py-2 text-sm font-bold transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
                {hint === 0 ? "💡 ขอคำใบ้ระดับ 1 (−25% แต้ม)" : hint === 1 ? "💡 ขอคำใบ้ระดับ 2 (−50% แต้ม)" : "💡 ใช้คำใบ้ครบแล้ว"}
              </button>
            ) : <span />}
            {answered && (
              <button onClick={next} className="rounded-full border-2 border-border bg-primary px-8 py-2.5 font-display text-lg font-bold text-primary-foreground ink-shadow transition hover:translate-y-1 hover:shadow-none active:scale-95">
                ข้อต่อไป →
              </button>
            )}
          </div>
        </article>
      )}

      <footer className="relative mt-10 text-center text-xs font-bold text-muted-foreground">
        🌈 Points = difficulty × 10 × (1 + 0.1 per streak, max 2×). Hint level 1 = 75% points, level 2 = 50%. Wrong answer resets streak.
      </footer>
    </main>
  );
}

function Stat({ emoji, label, value, sub, hot }: { emoji: string; label: string; value: string | number; sub?: string; hot?: boolean }) {
  return (
    <div className={`rounded-3xl border-2 border-border p-4 ink-shadow transition hover:-translate-y-1 ${hot ? "bg-flame text-primary-foreground" : "bg-card"}`}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-70">{emoji} {label}</p>
      <p className="font-display text-3xl font-extrabold">{value}</p>
      {sub && <p className="text-xs font-bold opacity-70">{sub}</p>}
    </div>
  );
}
