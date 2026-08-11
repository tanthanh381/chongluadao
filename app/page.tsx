"use client";

import { useEffect, useMemo, useState } from "react";
import { Difficulty, knowledgeCards, scenarios } from "./data";

type Result = { scenarioId: number; correct: boolean; choiceIndex: number };
type View = "game" | "knowledge" | "stats" | "evidence";

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
  const [playerName, setPlayerName] = useState("Người chơi ẩn danh");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("khien-so-progress");
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setBalance(saved.balance ?? 300_000_000);
        setAwareness(saved.awareness ?? 100);
        setResults(saved.results ?? []);
        setDark(saved.dark ?? false);
        setPlayerName(saved.playerName ?? "Người chơi ẩn danh");
      } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("khien-so-progress", JSON.stringify({ balance, awareness, results, dark, playerName }));
  }, [balance, awareness, results, dark, playerName, hydrated]);

  const selected = scenarios.find((item) => item.id === selectedId) ?? scenarios[0];
  const completedIds = new Set(results.map((result) => result.scenarioId));
  const safeIds = new Set(results.filter((result) => result.correct).map((result) => result.scenarioId));
  const evidence = scenarios.filter((item) => safeIds.has(item.id));
  const score = results.reduce((total, result) => total + (result.correct ? 120 : 20), 0);

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
  }

  function resetProgress() {
    setBalance(300_000_000);
    setAwareness(100);
    setResults([]);
    setAnswer(null);
    setSelectedId(1);
    setView("game");
  }

  function nextScenario() {
    const remaining = scenarios.find((item) => !completedIds.has(item.id));
    chooseScenario(remaining?.id ?? scenarios[0].id);
  }

  const previousResult = results.find((result) => result.scenarioId === selected.id);
  const selectedAnswer = answer ?? previousResult?.choiceIndex ?? null;

  return (
    <main className={dark ? "app dark" : "app"}>
      <header className="topbar">
        <button className="brand" onClick={() => setView("game")} aria-label="HDBank Phòng Bảo mật — về màn chơi">
          <img className="hdbank-logo" src="/hdbank-logo.png" alt="HDBank" />
          <span className="brand-divider" aria-hidden="true" />
          <span className="product-lockup"><strong>KHIÊN SỐ</strong><small>PHÒNG BẢO MẬT</small></span>
        </button>
        <nav aria-label="Điều hướng chính">
          <button className={view === "game" ? "active" : ""} onClick={() => setView("game")}>Mô phỏng</button>
          <button className={view === "knowledge" ? "active" : ""} onClick={() => setView("knowledge")}>Cẩm nang</button>
          <button className={view === "stats" ? "active" : ""} onClick={() => setView("stats")}>Thành tích</button>
        </nav>
        <div className="top-actions">
          <button className="icon-button" onClick={() => setDark((value) => !value)} aria-label="Đổi chế độ sáng tối">{dark ? "☀" : "☾"}</button>
          <button className="profile-button" onClick={() => setProfileOpen(true)}><span>{playerName.slice(0, 1).toUpperCase()}</span>{playerName}</button>
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
              {difficulties.map((item) => <button key={item} className={difficulty === item ? "active" : ""} onClick={() => setDifficulty(item)}>{item}</button>)}
            </div>
            <div className="scenario-list">
              {filtered.map((item) => (
                <button key={item.id} onClick={() => chooseScenario(item.id)} className={`scenario-item ${selected.id === item.id ? "selected" : ""}`}>
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
                  <div className={`feedback ${selected.choices[selectedAnswer].correct ? "success" : "danger"}`}>
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

      <footer><div className="footer-brand"><img src="/hdbank-logo.png" alt="HDBank"/><span><b>PHÒNG BẢO MẬT</b><small>Khiên Số · Đào tạo nhận thức an toàn thông tin</small></span></div><p>Không nhập dữ liệu cá nhân thật. Tiến trình chỉ được lưu trên thiết bị của bạn.</p><button onClick={() => setGuide(true)}>Hướng dẫn & trợ giúp</button></footer>

      {guide && <div className="modal-backdrop" role="presentation" onMouseDown={() => setGuide(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="guide-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setGuide(false)}>×</button><span className="modal-symbol">H</span><span className="eyebrow">HDBANK · PHÒNG BẢO MẬT</span><h2 id="guide-title">Dừng — Kiểm — Báo</h2><ol><li><b>01</b><div><strong>Dừng giao dịch</strong><p>Không chuyển thêm tiền, không cài ứng dụng và không cung cấp mã xác thực.</p></div></li><li><b>02</b><div><strong>Kiểm tra độc lập</strong><p>Tự gọi số chính thức của ngân hàng, tổ chức hoặc người thân qua kênh quen thuộc.</p></div></li><li><b>03</b><div><strong>Báo sớm, lưu kỹ</strong><p>Liên hệ HDBank 1900 6060, lưu ảnh chụp và trình báo cơ quan công an gần nhất.</p></div></li></ol><button className="primary-button" onClick={() => setGuide(false)}>Tôi đã hiểu</button></section></div>}

      {profileOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setProfileOpen(false)}><section className="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setProfileOpen(false)}>×</button><span className="eyebrow">HỒ SƠ CỤC BỘ</span><h2 id="profile-title">Tên hiển thị của bạn</h2><p>Không cần email hay số điện thoại. Tên này chỉ được lưu trên thiết bị.</p><input aria-label="Tên hiển thị" value={playerName} maxLength={32} onChange={(event) => setPlayerName(event.target.value)} /><button className="primary-button" onClick={() => setProfileOpen(false)}>Lưu tên</button></section></div>}
    </main>
  );
}
