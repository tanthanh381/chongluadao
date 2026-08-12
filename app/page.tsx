"use client";

/* eslint-disable @next/next/no-img-element -- this component also ships through a plain Vite/GitHub Pages build */

import { useEffect, useMemo, useRef, useState } from "react";
import { Difficulty, knowledgeCards, scenarios } from "./data";

type Result = { scenarioId: number; correct: boolean; choiceIndex: number };
type View = "game" | "knowledge" | "stats" | "evidence" | "dashboard";
type StoredProgress = {
  balance: number;
  awareness: number;
  results: Result[];
  dark: boolean;
  playerName: string;
};
type LocalAccount = {
  username: string;
  displayName: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
};
type AuthMode = "login" | "register";
type LossNotice = {
  scenarioTitle: string;
  amountLost: number;
  awarenessLost: number;
  balanceAfter: number;
};
type AnalyticsUser = {
  username: string;
  displayName: string;
  createdAt: string;
  completed: number;
  correct: number;
  accuracy: number;
  awareness: number;
  balance: number;
  loss: number;
  risk: "Thấp" | "Trung bình" | "Cao";
};

const ACCOUNTS_KEY = "khien-so-accounts";
const SESSION_KEY = "khien-so-session";
const LEGACY_PROGRESS_KEY = "khien-so-progress";

function progressKey(username: string | null) {
  return `khien-so-progress:${username ?? "guest"}`;
}

const money = new Intl.NumberFormat("vi-VN");
const difficulties: Array<"Tất cả" | Difficulty> = ["Tất cả", "Dễ", "Trung bình", "Khó", "Rất khó"];

const difficultyTone: Record<Difficulty, string> = {
  Dễ: "easy",
  "Trung bình": "medium",
  Khó: "hard",
  "Rất khó": "extreme",
};

function BadgeIcon({ children }: { children: React.ReactNode }) {
  return <span className="badge-icon" aria-hidden="true">{children}</span>;
}

function readStoredProgress(key: string): StoredProgress | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    const results = Array.isArray(saved.results)
      ? saved.results.filter((result): result is Result => {
          if (!result || typeof result !== "object") return false;
          const candidate = result as Record<string, unknown>;
          return Number.isInteger(candidate.scenarioId)
            && Number(candidate.scenarioId) >= 1
            && Number(candidate.scenarioId) <= scenarios.length
            && typeof candidate.correct === "boolean"
            && Number.isInteger(candidate.choiceIndex)
            && Number(candidate.choiceIndex) >= 0
            && Number(candidate.choiceIndex) <= 2;
        })
      : [];

    return {
      balance: typeof saved.balance === "number" && Number.isFinite(saved.balance)
        ? Math.max(0, Math.min(300_000_000, saved.balance))
        : 300_000_000,
      awareness: typeof saved.awareness === "number" && Number.isFinite(saved.awareness)
        ? Math.max(0, Math.min(100, saved.awareness))
        : 100,
      results,
      dark: saved.dark === true,
      playerName: typeof saved.playerName === "string" && saved.playerName.trim()
        ? saved.playerName.trim().slice(0, 32)
        : "Người chơi ẩn danh",
    };
  } catch {
    return null;
  }
}

function readLocalAccounts(): LocalAccount[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((account): account is LocalAccount => {
      if (!account || typeof account !== "object") return false;
      const item = account as Record<string, unknown>;
      return typeof item.username === "string"
        && typeof item.displayName === "string"
        && typeof item.salt === "string"
        && typeof item.passwordHash === "string"
        && typeof item.createdAt === "string";
    });
  } catch {
    return [];
  }
}

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function hashPassword(password: string, salt: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt: base64ToBytes(salt),
    iterations: 120_000,
    hash: "SHA-256",
  }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
}

function Modal({
  open,
  onClose,
  labelledBy,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusableSelector = "button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])";
    const focusTimer = window.setTimeout(() => {
      dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();
    }, 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-layer">
      <button className="modal-backdrop" aria-label="Đóng hộp thoại" onClick={onClose} />
      <section ref={dialogRef} className={`modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </section>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("game");
  const [selectedId, setSelectedId] = useState(1);
  const [difficulty, setDifficulty] = useState<"Tất cả" | Difficulty>("Tất cả");
  const [query, setQuery] = useState("");
  const [balance, setBalance] = useState(300_000_000);
  const [awareness, setAwareness] = useState(100);
  const [results, setResults] = useState<Result[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [dark, setDark] = useState(false);
  const [guide, setGuide] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [lossNotice, setLossNotice] = useState<LossNotice | null>(null);
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [sessionUsername, setSessionUsername] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("Người chơi ẩn danh");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedAccounts = readLocalAccounts();
      const storedSession = localStorage.getItem(SESSION_KEY);
      const validSession = storedSession && storedAccounts.some((account) => account.username === storedSession)
        ? storedSession
        : null;
      let saved = readStoredProgress(progressKey(validSession));
      if (!validSession && !saved) {
        saved = readStoredProgress(LEGACY_PROGRESS_KEY);
        if (saved) localStorage.setItem(progressKey(null), JSON.stringify(saved));
      }
      if (saved) {
        setBalance(saved.balance ?? 300_000_000);
        setAwareness(saved.awareness ?? 100);
        setResults(saved.results ?? []);
        setDark(saved.dark ?? false);
        const accountName = validSession
          ? storedAccounts.find((account) => account.username === validSession)?.displayName
          : null;
        setPlayerName(accountName ?? saved.playerName ?? "Người chơi ẩn danh");
      } else if (validSession) {
        setPlayerName(storedAccounts.find((account) => account.username === validSession)?.displayName ?? "Người chơi ẩn danh");
      }
      setAccounts(storedAccounts);
      if (validSession) {
        setSessionUsername(validSession);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(progressKey(sessionUsername), JSON.stringify({ balance, awareness, results, dark, playerName }));
  }, [balance, awareness, results, dark, playerName, hydrated, sessionUsername]);

  const selected = scenarios.find((item) => item.id === selectedId) ?? scenarios[0];
  const completedIds = new Set(results.map((result) => result.scenarioId));
  const safeIds = new Set(results.filter((result) => result.correct).map((result) => result.scenarioId));
  const evidence = scenarios.filter((item) => safeIds.has(item.id));
  const score = results.reduce((total, result) => total + (result.correct ? 120 : 20), 0);
  const activeAccount = accounts.find((account) => account.username === sessionUsername) ?? null;

  const analyticsUsers = useMemo<AnalyticsUser[]>(() => {
    if (!hydrated) return [];
    return accounts.map((account) => {
      const saved = account.username === sessionUsername
        ? { balance, awareness, results }
        : readStoredProgress(progressKey(account.username));
      const accountResults = saved?.results ?? [];
      const correct = accountResults.filter((result) => result.correct).length;
      const completed = new Set(accountResults.map((result) => result.scenarioId)).size;
      const accuracy = accountResults.length ? Math.round((correct / accountResults.length) * 100) : 0;
      const accountAwareness = saved?.awareness ?? 100;
      const accountBalance = saved?.balance ?? 300_000_000;
      const risk = accountResults.length === 0
        ? "Trung bình"
        : accuracy < 60 || accountAwareness < 70
          ? "Cao"
          : accuracy < 80 || accountAwareness < 85
            ? "Trung bình"
            : "Thấp";
      return {
        username: account.username,
        displayName: account.displayName,
        createdAt: account.createdAt,
        completed,
        correct,
        accuracy,
        awareness: accountAwareness,
        balance: accountBalance,
        loss: Math.max(0, 300_000_000 - accountBalance),
        risk,
      };
    });
  }, [accounts, awareness, balance, hydrated, results, sessionUsername]);

  const analytics = useMemo(() => {
    const attempts = analyticsUsers.reduce((sum, user) => sum + user.completed, 0);
    const correct = analyticsUsers.reduce((sum, user) => sum + user.correct, 0);
    const active = analyticsUsers.filter((user) => user.completed > 0).length;
    return {
      active,
      participation: analyticsUsers.length ? Math.round((active / analyticsUsers.length) * 100) : 0,
      attempts,
      correct,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
      highRisk: analyticsUsers.filter((user) => user.risk === "Cao").length,
      totalLoss: analyticsUsers.reduce((sum, user) => sum + user.loss, 0),
    };
  }, [analyticsUsers]);

  const scenarioRisks = useMemo(() => scenarios.map((scenario) => {
    const attempts = analyticsUsers.reduce((sum, user) => {
      const saved = user.username === sessionUsername ? results : readStoredProgress(progressKey(user.username))?.results ?? [];
      return [...sum, ...saved.filter((result) => result.scenarioId === scenario.id)];
    }, [] as Result[]);
    const wrong = attempts.filter((result) => !result.correct).length;
    return { ...scenario, attempts: attempts.length, wrong, rate: attempts.length ? Math.round((wrong / attempts.length) * 100) : 0 };
  }).sort((a, b) => b.rate - a.rate || b.attempts - a.attempts).slice(0, 5), [analyticsUsers, results, sessionUsername]);

  const filtered = useMemo(() => scenarios.filter((item) => {
    const matchesDifficulty = difficulty === "Tất cả" || item.difficulty === difficulty;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || `${item.title} ${item.category} ${item.channel}`.toLowerCase().includes(needle);
    return matchesDifficulty && matchesQuery;
  }), [difficulty, query]);

  const streak = useMemo(() => {
    let current = 0;
    let best = 0;
    results.forEach((result) => {
      current = result.correct ? current + 1 : 0;
      best = Math.max(best, current);
    });
    return best;
  }, [results]);

  const unlockedBadges = [
    { icon: "◇", name: "Tân binh cảnh giác", unlocked: results.length >= 1 },
    { icon: "◉", name: "Mắt thần phishing", unlocked: safeIds.has(2) && safeIds.has(8) },
    { icon: "⌗", name: "Thợ săn QR giả", unlocked: safeIds.has(5) },
    { icon: "✦", name: "Khắc tinh deepfake", unlocked: safeIds.has(3) },
    { icon: "▲", name: "Chuỗi 3 an toàn", unlocked: streak >= 3 },
    { icon: "⬢", name: "Chuyên gia Khiên Số", unlocked: safeIds.size === scenarios.length },
  ];

  function chooseScenario(id: number) {
    setSelectedId(id);
    setAnswer(null);
    setView("game");
    if (window.innerWidth < 1050) document.querySelector(".stage")?.scrollIntoView({ behavior: "smooth" });
  }

  function submitChoice(index: number) {
    if (answer !== null || completedIds.has(selected.id)) return;
    const choice = selected.choices[index];
    setAnswer(index);
    setBalance((value) => Math.max(0, value + choice.moneyDelta));
    setAwareness((value) => Math.max(0, Math.min(100, value + choice.awarenessDelta)));
    setResults((value) => [...value, { scenarioId: selected.id, correct: choice.correct, choiceIndex: index }]);
    if (!choice.correct) {
      setLossNotice({
        scenarioTitle: selected.title,
        amountLost: Math.max(0, -choice.moneyDelta),
        awarenessLost: Math.max(0, -choice.awarenessDelta),
        balanceAfter: Math.max(0, balance + choice.moneyDelta),
      });
    }
  }

  function resetProgress() {
    setBalance(300_000_000);
    setAwareness(100);
    setResults([]);
    setAnswer(null);
    setLossNotice(null);
    setSelectedId(1);
    setView("game");
  }

  function loadProgressForSession(username: string | null, displayName = "Người chơi ẩn danh") {
    const saved = readStoredProgress(progressKey(username));
    setBalance(saved?.balance ?? 300_000_000);
    setAwareness(saved?.awareness ?? 100);
    setResults(saved?.results ?? []);
    setDark(saved?.dark ?? false);
    setPlayerName(displayName);
    setAnswer(null);
    setLossNotice(null);
    setSelectedId(1);
    setDifficulty("Tất cả");
    setQuery("");
    setView("game");
  }

  function resetAuthForm() {
    setAuthUsername("");
    setAuthDisplayName("");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setAuthError("");
    setAuthBusy(false);
  }

  function closeAuth() {
    resetAuthForm();
    setAuthOpen(false);
  }

  function openAuth(mode: AuthMode) {
    resetAuthForm();
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function switchAuthMode(mode: AuthMode) {
    resetAuthForm();
    setAuthMode(mode);
  }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = authUsername.trim().toLowerCase();
    setAuthError("");

    if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
      setAuthError("Tên đăng nhập cần 3–24 ký tự: chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới.");
      return;
    }
    if (authPassword.length < 8) {
      setAuthError("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }

    setAuthBusy(true);
    try {
      if (authMode === "register") {
        const displayName = authDisplayName.trim();
        if (displayName.length < 2 || displayName.length > 32) {
          setAuthError("Tên hiển thị cần từ 2 đến 32 ký tự.");
          return;
        }
        if (authPassword !== authConfirmPassword) {
          setAuthError("Mật khẩu xác nhận chưa khớp.");
          return;
        }
        if (accounts.some((account) => account.username === username)) {
          setAuthError("Tên đăng nhập này đã tồn tại trên thiết bị.");
          return;
        }
        const saltBytes = crypto.getRandomValues(new Uint8Array(16));
        const salt = bytesToBase64(saltBytes);
        const passwordHash = await hashPassword(authPassword, salt);
        const nextAccounts = [...accounts, {
          username,
          displayName,
          salt,
          passwordHash,
          createdAt: new Date().toISOString(),
        }];
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
        localStorage.setItem(SESSION_KEY, username);
        setAccounts(nextAccounts);
        setSessionUsername(username);
        loadProgressForSession(username, displayName);
      } else {
        const account = accounts.find((item) => item.username === username);
        if (!account || await hashPassword(authPassword, account.salt) !== account.passwordHash) {
          setAuthError("Tên đăng nhập hoặc mật khẩu không đúng.");
          return;
        }
        localStorage.setItem(SESSION_KEY, account.username);
        setSessionUsername(account.username);
        loadProgressForSession(account.username, account.displayName);
      }
      closeAuth();
    } catch {
      setAuthError("Không thể xử lý đăng nhập trên trình duyệt này. Vui lòng thử lại.");
    } finally {
      setAuthBusy(false);
    }
  }

  function closeProfile() {
    const displayName = playerName.trim() || "Người chơi ẩn danh";
    setPlayerName(displayName);
    if (activeAccount) {
      const nextAccounts = accounts.map((account) => account.username === activeAccount.username
        ? { ...account, displayName }
        : account);
      setAccounts(nextAccounts);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    }
    setProfileOpen(false);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSessionUsername(null);
    loadProgressForSession(null);
    setProfileOpen(false);
  }

  function nextScenario() {
    const remaining = scenarios.find((item) => !completedIds.has(item.id));
    chooseScenario(remaining?.id ?? scenarios[0].id);
  }

  function exportCisoReport() {
    const header = ["Tên hiển thị", "Tên đăng nhập", "Ngày đăng ký", "Đã hoàn thành", "Chính xác (%)", "Cảnh giác (%)", "Tổn thất (VND)", "Mức rủi ro"];
    const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = analyticsUsers.map((user) => [
      user.displayName,
      user.username,
      new Date(user.createdAt).toLocaleDateString("vi-VN"),
      user.completed,
      user.accuracy,
      user.awareness,
      user.loss,
      user.risk,
    ]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-khien-so-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const previousResult = results.find((result) => result.scenarioId === selected.id);
  const selectedAnswer = answer ?? previousResult?.choiceIndex ?? null;

  return (
    <main className={dark ? "app dark" : "app"}>
      <header className="topbar">
        <button className="brand" onClick={() => setView("game")} aria-label="HDBank Phòng Bảo mật — về màn chơi">
          <img className="hdbank-logo" src="hdbank-logo.png" alt="HDBank" />
          <span className="brand-divider" aria-hidden="true" />
          <span className="product-lockup"><strong>KHIÊN SỐ</strong><small>PHÒNG BẢO MẬT</small></span>
        </button>
        <nav aria-label="Điều hướng chính">
          <button aria-current={view === "game" ? "page" : undefined} className={view === "game" ? "active" : ""} onClick={() => setView("game")}>Mô phỏng</button>
          <button aria-current={view === "knowledge" ? "page" : undefined} className={view === "knowledge" ? "active" : ""} onClick={() => setView("knowledge")}>Cẩm nang</button>
          <button aria-current={view === "stats" ? "page" : undefined} className={view === "stats" ? "active" : ""} onClick={() => setView("stats")}>Thành tích</button>
          <button aria-current={view === "dashboard" ? "page" : undefined} className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Dashboard</button>
        </nav>
        <div className="top-actions">
          <button className="icon-button" aria-pressed={dark} onClick={() => setDark((value) => !value)} aria-label="Đổi chế độ sáng tối">{dark ? "☀" : "☾"}</button>
          {activeAccount ? (
            <button className="profile-button" onClick={() => setProfileOpen(true)} aria-label={`Mở tài khoản của ${playerName}`}><span>{playerName.trim().slice(0, 1).toUpperCase() || "N"}</span>{playerName}</button>
          ) : (
            <div className="auth-actions">
              <button className="login-button" onClick={() => openAuth("login")}>Đăng nhập</button>
              <button className="signup-button" onClick={() => openAuth("register")}>Đăng ký</button>
            </div>
          )}
        </div>
      </header>

      {view === "game" && (
        <div className="game-shell">
          <aside className="scenario-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">THƯ VIỆN TÌNH HUỐNG</span><h1>Chọn một thử thách</h1></div>
              <span className="scenario-count">{safeIds.size}/{scenarios.length}</span>
            </div>
            <div className="search-box"><span>⌕</span><input aria-label="Tìm kịch bản" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, kênh..." /></div>
            <div className="difficulty-filter" aria-label="Lọc độ khó">
              {difficulties.map((item) => <button key={item} aria-pressed={difficulty === item} className={difficulty === item ? "active" : ""} onClick={() => setDifficulty(item)}>{item}</button>)}
            </div>
            <div className="scenario-list">
              {filtered.map((item) => (
                <button key={item.id} aria-pressed={selected.id === item.id} onClick={() => chooseScenario(item.id)} className={`scenario-item ${selected.id === item.id ? "selected" : ""}`}>
                  <span className={`scenario-number ${safeIds.has(item.id) ? "done" : ""}`}>{safeIds.has(item.id) ? "✓" : String(item.id).padStart(2, "0")}</span>
                  <span className="scenario-copy"><strong>{item.title}</strong><small>{item.channel} · {item.category}</small></span>
                  <span className={`difficulty-dot ${difficultyTone[item.difficulty]}`} title={item.difficulty}></span>
                </button>
              ))}
              {!filtered.length && <p className="empty-state">Không tìm thấy tình huống phù hợp.</p>}
            </div>
            <button className="random-button" onClick={() => chooseScenario(scenarios[Math.floor(Math.random() * scenarios.length)].id)}>⤨ Chọn tình huống ngẫu nhiên</button>
          </aside>

          <section className="stage">
            <div className="status-grid">
              <div className="status-card"><BadgeIcon>₫</BadgeIcon><span><small>Tài sản an toàn</small><strong>{money.format(balance)}đ</strong></span></div>
              <div className="status-card"><BadgeIcon>⌁</BadgeIcon><span><small>Mức cảnh giác</small><strong>{awareness}%</strong></span><div className="meter"><i style={{ width: `${awareness}%` }} /></div></div>
              <div className="status-card compact"><BadgeIcon>◆</BadgeIcon><span><small>Điểm phòng vệ</small><strong>{score}</strong></span></div>
              <button className="status-card compact evidence-link" onClick={() => setView("evidence")}><BadgeIcon>▤</BadgeIcon><span><small>Chứng cứ</small><strong>{evidence.length}</strong></span></button>
            </div>

            {(balance === 0 || awareness === 0) ? (
              <section className="game-over card-surface">
                <span className="giant-icon">!</span><span className="eyebrow">PHÒNG TUYẾN ĐÃ VỠ</span>
                <h2>Bạn đã để kẻ gian chiếm ưu thế</h2><p>Không sao — mỗi lần nhận ra một dấu hiệu là thêm một lớp bảo vệ ngoài đời thật.</p>
                <button className="primary-button" onClick={resetProgress}>Bắt đầu hành trình mới</button>
              </section>
            ) : (
              <section className="scenario-stage card-surface">
                <div className="scenario-meta"><span className={`level-pill ${difficultyTone[selected.difficulty]}`}>{selected.difficulty}</span><span>{selected.channel}</span><span>{selected.category}</span></div>
                <div className="scenario-title-row"><span className="scenario-hero-icon">{selected.icon}</span><div><span className="eyebrow">TÌNH HUỐNG {String(selected.id).padStart(2, "0")}</span><h2>{selected.title}</h2></div></div>
                <div className="story-box"><span className="quote-mark">“</span><p>{selected.story}</p></div>
                <div className="red-flags"><strong>Dấu hiệu cần quan sát</strong><div>{selected.redFlags.map((flag) => <span key={flag}>△ {flag}</span>)}</div></div>
                <h3 className="decision-title">Bạn sẽ xử lý thế nào?</h3>
                <div className="choice-list">
                  {selected.choices.map((choice, index) => {
                    const isChosen = selectedAnswer === index;
                    const state = selectedAnswer === null ? "" : isChosen ? (choice.correct ? "correct" : "wrong") : "disabled";
                    return <button key={choice.text} className={`choice ${state}`} onClick={() => submitChoice(index)} disabled={selectedAnswer !== null}>
                      <span className="choice-letter">{String.fromCharCode(65 + index)}</span><span>{choice.text}</span>{isChosen && <b>{choice.correct ? "✓" : "×"}</b>}
                    </button>;
                  })}
                </div>
                {selectedAnswer !== null && (
                  <div role="status" aria-live="polite" className={`feedback ${selected.choices[selectedAnswer].correct ? "success" : "danger"}`}>
                    <div><strong>{selected.choices[selectedAnswer].correct ? "Lựa chọn an toàn" : "Bạn đã mắc bẫy"}</strong><p>{selected.choices[selectedAnswer].feedback}</p><small>Mẹo ghi nhớ: {selected.tip}</small></div>
                    <button onClick={nextScenario}>Kịch bản tiếp theo →</button>
                  </div>
                )}
              </section>
            )}
          </section>

          <aside className="insight-panel">
            <div className="coach-card">
              <span className="eyebrow">HDBANK · PHÒNG BẢO MẬT</span><h3>Ghi nhớ trong tình huống này</h3><p>{selected.tip}</p>
              <button onClick={() => setGuide(true)}>Xem quy tắc 3 bước</button>
            </div>
            <div className="progress-card">
              <div className="section-title"><span><small>TIẾN TRÌNH</small><strong>{Math.round((safeIds.size / scenarios.length) * 100)}%</strong></span></div>
              <div className="ring" style={{ "--progress": `${(safeIds.size / scenarios.length) * 360}deg` } as React.CSSProperties}><span>{safeIds.size}<small>an toàn</small></span></div>
              <div className="mini-stats"><span><strong>{streak}</strong> chuỗi tốt nhất</span><span><strong>{unlockedBadges.filter((item) => item.unlocked).length}</strong> huy hiệu</span></div>
            </div>
            <div className="badge-card">
              <div className="section-title"><h3>Huy hiệu gần nhất</h3><button onClick={() => setView("stats")}>Xem tất cả</button></div>
              <div className="badge-preview">{unlockedBadges.slice(0, 4).map((badge) => <span className={badge.unlocked ? "unlocked" : ""} key={badge.name} title={badge.name}>{badge.icon}</span>)}</div>
            </div>
            <button className="emergency-card" onClick={() => setGuide(true)}><span>!</span><div><strong>Đã lỡ chuyển tiền?</strong><small>Mở hướng dẫn xử lý khẩn cấp</small></div><b>→</b></button>
          </aside>
        </div>
      )}

      {view === "knowledge" && (
        <section className="content-page">
          <div className="page-hero"><span className="eyebrow">HDBANK · PHÒNG BẢO MẬT</span><h1>Sáu thói quen nhỏ,<br/>một lớp giáp lớn.</h1><p>Cẩm nang an toàn số giúp bạn nhận ra áp lực, kiểm tra danh tính và giữ quyền kiểm soát trước mọi giao dịch.</p></div>
          <div className="knowledge-grid">{knowledgeCards.map((card, index) => <article key={card.title}><span>{String(index + 1).padStart(2, "0")}</span><BadgeIcon>{card.icon}</BadgeIcon><h2>{card.title}</h2><p>{card.text}</p></article>)}</div>
          <div className="hotline-strip"><span>HỖ TRỢ KHẨN CẤP</span><strong>Liên hệ HDBank 1900 6060</strong><p>Yêu cầu khoá giao dịch, lưu bằng chứng và trình báo cơ quan công an gần nhất. Không trả thêm “phí thu hồi” cho bất kỳ ai.</p></div>
        </section>
      )}

      {view === "stats" && (
        <section className="content-page stats-page">
          <div className="page-hero"><span className="eyebrow">HỒ SƠ PHÒNG VỆ</span><h1>{playerName}</h1><p>Tiến bộ của bạn được lưu riêng trên thiết bị này.</p></div>
          <div className="stats-overview"><article><small>Kịch bản đã thử</small><strong>{results.length}</strong><span>/ {scenarios.length}</span></article><article><small>Xử lý an toàn</small><strong>{safeIds.size}</strong><span>{results.length ? Math.round((safeIds.size / results.length) * 100) : 0}% chính xác</span></article><article><small>Điểm phòng vệ</small><strong>{score}</strong><span>cấp {Math.floor(score / 500) + 1}</span></article><article><small>Tài sản còn lại</small><strong className="money-stat">{money.format(balance)}đ</strong><span>bảo toàn {Math.round((balance / 300_000_000) * 100)}%</span></article></div>
          <div className="achievement-section"><div><span className="eyebrow">BỘ SƯU TẬP</span><h2>Huy hiệu phòng vệ</h2></div><div className="achievement-grid">{unlockedBadges.map((badge) => <article className={badge.unlocked ? "unlocked" : ""} key={badge.name}><span>{badge.icon}</span><div><strong>{badge.name}</strong><small>{badge.unlocked ? "Đã mở khoá" : "Chưa mở khoá"}</small></div></article>)}</div></div>
          <button className="reset-button" onClick={resetProgress}>Đặt lại toàn bộ tiến trình</button>
        </section>
      )}

      {view === "evidence" && (
        <section className="content-page">
          <button className="back-button" onClick={() => setView("game")}>← Quay lại màn chơi</button>
          <div className="page-hero"><span className="eyebrow">HỘP CHỨNG CỨ</span><h1>Dấu vết bạn đã thu thập</h1><p>Mỗi kịch bản xử lý đúng mở khoá một chứng cứ và một bài học có thể áp dụng ngoài đời.</p></div>
          <div className="evidence-grid">{scenarios.map((item) => <article className={safeIds.has(item.id) ? "unlocked" : ""} key={item.id}><span className="evidence-icon">{safeIds.has(item.id) ? item.icon : "?"}</span><div><small>CHỨNG CỨ {String(item.id).padStart(2, "0")}</small><h2>{safeIds.has(item.id) ? item.evidence : "Chưa xác định"}</h2><p>{safeIds.has(item.id) ? item.tip : "Xử lý an toàn kịch bản này để mở khoá."}</p></div></article>)}</div>
        </section>
      )}

      {view === "dashboard" && (
        <section className="content-page dashboard-page">
          <div className="dashboard-heading">
            <div><span className="eyebrow">HDBANK · PHÒNG BẢO MẬT</span><h1>Dashboard nhận thức an toàn</h1><p>Góc nhìn tổng hợp phục vụ báo cáo CISO trên dữ liệu mô phỏng của trình duyệt hiện tại.</p></div>
            <button className="export-button" onClick={exportCisoReport} disabled={!analyticsUsers.length}>⇩ Xuất báo cáo CSV</button>
          </div>
          <div className="data-scope-note" role="note"><strong>Phạm vi dữ liệu:</strong> {analyticsUsers.length} tài khoản trên thiết bị này · Cập nhật theo thời gian thực · Không chứa mật khẩu hoặc dữ liệu ngân hàng.</div>

          <div className="ciso-kpis">
            <article><small>Người dùng đã đăng ký</small><strong>{analyticsUsers.length}</strong><span>{analytics.active} đã tham gia đào tạo</span></article>
            <article><small>Tỷ lệ tham gia</small><strong>{analytics.participation}%</strong><span>{analytics.active}/{analyticsUsers.length || 0} người dùng hoạt động</span></article>
            <article><small>Tỷ lệ xử lý an toàn</small><strong>{analytics.accuracy}%</strong><span>{analytics.correct}/{analytics.attempts} lượt đúng</span></article>
            <article className={analytics.highRisk ? "risk-kpi" : ""}><small>Người dùng rủi ro cao</small><strong>{analytics.highRisk}</strong><span>Cần ưu tiên đào tạo lại</span></article>
            <article><small>Tổn thất mô phỏng</small><strong className="dashboard-money">{money.format(analytics.totalLoss)}đ</strong><span>Tổng tác động từ lựa chọn sai</span></article>
          </div>

          <div className="dashboard-grid">
            <article className="dashboard-card outcome-card">
              <div className="dashboard-card-title"><div><small>HIỆU QUẢ ĐÀO TẠO</small><h2>Kết quả xử lý tình huống</h2></div><strong>{analytics.attempts} lượt</strong></div>
              <div className="outcome-chart" aria-label={`${analytics.correct} lượt an toàn, ${Math.max(0, analytics.attempts - analytics.correct)} lượt mắc bẫy`}>
                <div className="outcome-bar"><span style={{ width: `${analytics.accuracy}%` }} /></div>
                <div className="outcome-legend"><span><i className="safe-dot" />An toàn <b>{analytics.correct}</b></span><span><i className="risk-dot" />Mắc bẫy <b>{Math.max(0, analytics.attempts - analytics.correct)}</b></span></div>
              </div>
            </article>
            <article className="dashboard-card">
              <div className="dashboard-card-title"><div><small>RỦI RO NỔI BẬT</small><h2>Kịch bản dễ mắc bẫy</h2></div></div>
              <div className="risk-ranking">
                {scenarioRisks.map((item, index) => <div key={item.id}><span>{index + 1}</span><div><strong>{item.title}</strong><small>{item.attempts ? `${item.wrong}/${item.attempts} lượt sai` : "Chưa có dữ liệu"}</small></div><b>{item.rate}%</b></div>)}
              </div>
            </article>
          </div>

          <article className="dashboard-card user-analysis">
            <div className="dashboard-card-title"><div><small>PHÂN TÍCH NGƯỜI DÙNG</small><h2>Danh sách ưu tiên đào tạo</h2></div><span>Sắp xếp theo mức rủi ro</span></div>
            <div className="analytics-table-wrap"><table><thead><tr><th>Người dùng</th><th>Tham gia</th><th>Chính xác</th><th>Cảnh giác</th><th>Tổn thất mô phỏng</th><th>Đánh giá</th></tr></thead><tbody>
              {[...analyticsUsers].sort((a, b) => ({ Cao: 0, "Trung bình": 1, Thấp: 2 }[a.risk] - { Cao: 0, "Trung bình": 1, Thấp: 2 }[b.risk])).map((user) => <tr key={user.username}><td><strong>{user.displayName}</strong><small>@{user.username} · {new Date(user.createdAt).toLocaleDateString("vi-VN")}</small></td><td>{user.completed}/{scenarios.length}</td><td>{user.accuracy}%</td><td>{user.awareness}%</td><td>{money.format(user.loss)}đ</td><td><span className={`risk-label risk-${user.risk === "Cao" ? "high" : user.risk === "Thấp" ? "low" : "medium"}`}>{user.risk}</span></td></tr>)}
              {!analyticsUsers.length && <tr><td colSpan={6} className="empty-table">Chưa có tài khoản để phân tích.</td></tr>}
            </tbody></table></div>
          </article>
        </section>
      )}

      <footer><div className="footer-brand"><img src="hdbank-logo.png" alt="HDBank"/><span><b>PHÒNG BẢO MẬT</b><small>Khiên Số · Đào tạo nhận thức an toàn thông tin</small></span></div><p>Không nhập dữ liệu cá nhân thật. Tiến trình chỉ được lưu trên thiết bị của bạn.</p><button onClick={() => setGuide(true)}>Hướng dẫn & trợ giúp</button></footer>

      {lossNotice && <Modal open onClose={() => setLossNotice(null)} labelledBy="loss-notice-title" className="loss-modal">
        <button className="modal-close" aria-label="Đóng cảnh báo tổn thất" onClick={() => setLossNotice(null)}>×</button>
        <span className="loss-symbol" aria-hidden="true">!</span>
        <span className="eyebrow">CẢNH BÁO TỪ KHIÊN SỐ</span>
        <h2 id="loss-notice-title">{lossNotice.amountLost > 0 ? "Tài sản vừa bị tổn thất" : "Mức cảnh giác vừa giảm"}</h2>
        <p className="loss-context">Lựa chọn trong tình huống “{lossNotice.scenarioTitle}” đã tạo hậu quả:</p>
        <div className="loss-summary">
          <div className={lossNotice.amountLost > 0 ? "has-loss" : ""}><small>Tài sản bị trừ</small><strong>{lossNotice.amountLost > 0 ? `−${money.format(lossNotice.amountLost)}đ` : "0đ"}</strong></div>
          <div className={lossNotice.awarenessLost > 0 ? "has-loss" : ""}><small>Cảnh giác giảm</small><strong>{lossNotice.awarenessLost > 0 ? `−${lossNotice.awarenessLost}%` : "0%"}</strong></div>
        </div>
        <div className="remaining-balance"><span>Tài sản còn lại</span><strong>{money.format(lossNotice.balanceAfter)}đ</strong></div>
        <p className="loss-reminder">Dừng lại, kiểm tra bằng kênh độc lập và không tiếp tục chuyển tiền khi đang bị thúc ép.</p>
        <button className="primary-button loss-confirm" onClick={() => setLossNotice(null)}>Đã hiểu hậu quả</button>
      </Modal>}

      <Modal open={guide} onClose={() => setGuide(false)} labelledBy="guide-title"><button className="modal-close" aria-label="Đóng hướng dẫn" onClick={() => setGuide(false)}>×</button><span className="modal-symbol">H</span><span className="eyebrow">HDBANK · PHÒNG BẢO MẬT</span><h2 id="guide-title">Dừng — Kiểm — Báo</h2><ol><li><b>01</b><div><strong>Dừng giao dịch</strong><p>Không chuyển thêm tiền, không cài ứng dụng và không cung cấp mã xác thực.</p></div></li><li><b>02</b><div><strong>Kiểm tra độc lập</strong><p>Tự gọi số chính thức của ngân hàng, tổ chức hoặc người thân qua kênh quen thuộc.</p></div></li><li><b>03</b><div><strong>Báo sớm, lưu kỹ</strong><p>Liên hệ HDBank 1900 6060, lưu ảnh chụp và trình báo cơ quan công an gần nhất.</p></div></li></ol><button className="primary-button" onClick={() => setGuide(false)}>Tôi đã hiểu</button></Modal>

      <Modal open={authOpen} onClose={closeAuth} labelledBy="auth-title" className="auth-modal">
        <button className="modal-close" aria-label="Đóng đăng nhập" onClick={closeAuth}>×</button>
        <span className="modal-symbol">H</span>
        <span className="eyebrow">KHIÊN SỐ · TÀI KHOẢN THIẾT BỊ</span>
        <div className="auth-tabs" aria-label="Chọn hình thức tài khoản">
          <button type="button" aria-pressed={authMode === "login"} className={authMode === "login" ? "active" : ""} onClick={() => switchAuthMode("login")}>Đăng nhập</button>
          <button type="button" aria-pressed={authMode === "register"} className={authMode === "register" ? "active" : ""} onClick={() => switchAuthMode("register")}>Đăng ký</button>
        </div>
        <h2 id="auth-title">{authMode === "login" ? "Chào mừng trở lại" : "Tạo hồ sơ phòng vệ"}</h2>
        <p className="auth-intro">Tài khoản mô phỏng chỉ được lưu trên trình duyệt hiện tại. Không sử dụng tên đăng nhập hoặc mật khẩu ngân hàng thật.</p>
        <form className="auth-form" onSubmit={submitAuth}>
          {authMode === "register" && <label><span>Tên hiển thị</span><input autoComplete="name" value={authDisplayName} maxLength={32} onChange={(event) => setAuthDisplayName(event.target.value)} placeholder="Ví dụ: Minh An" /></label>}
          <label><span>Tên đăng nhập</span><input autoComplete="username" value={authUsername} maxLength={24} onChange={(event) => setAuthUsername(event.target.value)} placeholder="minhan_01" autoCapitalize="none" spellCheck={false} /></label>
          <label><span>Mật khẩu</span><input type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Ít nhất 8 ký tự" /></label>
          {authMode === "register" && <label><span>Xác nhận mật khẩu</span><input type="password" autoComplete="new-password" value={authConfirmPassword} onChange={(event) => setAuthConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" /></label>}
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? "Đang bảo vệ tài khoản…" : authMode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</button>
        </form>
        <p className="auth-security-note"><b>Riêng tư:</b> Mật khẩu được băm trước khi lưu. Tài khoản không đồng bộ sang thiết bị khác.</p>
      </Modal>

      <Modal open={profileOpen} onClose={closeProfile} labelledBy="profile-title" className="profile-modal"><button className="modal-close" aria-label="Đóng hồ sơ" onClick={closeProfile}>×</button><span className="eyebrow">TÀI KHOẢN ĐÃ ĐĂNG NHẬP</span><h2 id="profile-title">Hồ sơ của bạn</h2><p className="account-username">@{activeAccount?.username}</p><label className="profile-name-field"><span>Tên hiển thị</span><input aria-label="Tên hiển thị" value={playerName} maxLength={32} onChange={(event) => setPlayerName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") closeProfile(); }} /></label><div className="profile-actions"><button className="primary-button" onClick={closeProfile}>Lưu thay đổi</button><button className="logout-button" onClick={logout}>Đăng xuất</button></div><p className="profile-note">Tiến trình chơi và tài khoản chỉ được lưu trên thiết bị này.</p></Modal>
    </main>
  );
}
