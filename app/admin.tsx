"use client";

import { useEffect, useMemo, useState } from "react";
import { Difficulty, KnowledgeCard, Scenario, SiteContent, normalizeSiteContent } from "./data";
import { supabase } from "./supabase";

type AdminAccount = { id: string; displayName: string; email: string };
type AdminState = "checking" | "ready" | "forbidden" | "error";
type AdminTab = "general" | "scenarios" | "knowledge";

const difficultyOptions: Difficulty[] = ["Dễ", "Trung bình", "Khó", "Rất khó"];

function cloneContent(content: SiteContent): SiteContent {
  return structuredClone(content);
}

export function AdminPage({
  account,
  publishedContent,
  onLogin,
  onPublished,
}: {
  account: AdminAccount | null;
  publishedContent: SiteContent;
  onLogin: () => void;
  onPublished: (content: SiteContent) => void;
}) {
  const [access, setAccess] = useState<AdminState>(account ? "checking" : "forbidden");
  const [draft, setDraft] = useState(() => cloneContent(publishedContent));
  const [published, setPublished] = useState(() => cloneContent(publishedContent));
  const [tab, setTab] = useState<AdminTab>("general");
  const [selectedScenarioId, setSelectedScenarioId] = useState(publishedContent.scenarios[0]?.id ?? 1);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    let active = true;
    void (async () => {
      setAccess("checking");
      const permission = await supabase.rpc("get_ciso_dashboard");
      if (!active) return;
      if (permission.error?.code === "42501") {
        setAccess("forbidden");
        return;
      }
      if (permission.error) {
        setAccess("error");
        return;
      }
      const { data, error } = await supabase
        .from("site_content")
        .select("slug, content, updated_at")
        .in("slug", ["main", "main-draft"]);
      if (!active) return;
      if (error) {
        setAccess("error");
        return;
      }
      const rows = data ?? [];
      const publishedRow = rows.find((row) => row.slug === "main");
      const draftRow = rows.find((row) => row.slug === "main-draft");
      const normalizedPublished = normalizeSiteContent(publishedRow?.content) ?? publishedContent;
      const normalizedDraft = normalizeSiteContent(draftRow?.content) ?? normalizedPublished;
      setPublished(cloneContent(normalizedPublished));
      setDraft(cloneContent(normalizedDraft));
      setSelectedScenarioId(normalizedDraft.scenarios[0]?.id ?? 1);
      setUpdatedAt(draftRow?.updated_at ?? publishedRow?.updated_at ?? null);
      setAccess("ready");
    })();
    return () => { active = false; };
  }, [account, publishedContent]);

  const selectedScenario = useMemo(
    () => draft.scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? draft.scenarios[0],
    [draft.scenarios, selectedScenarioId],
  );

  function changeCopy(key: keyof SiteContent["copy"], value: string) {
    setDraft((current) => ({ ...current, copy: { ...current.copy, [key]: value } }));
  }

  function changeScenario(patch: Partial<Scenario>) {
    setDraft((current) => ({
      ...current,
      scenarios: current.scenarios.map((scenario) => scenario.id === selectedScenarioId ? { ...scenario, ...patch } : scenario),
    }));
  }

  function changeChoice(index: number, patch: Partial<Scenario["choices"][number]>) {
    if (!selectedScenario) return;
    const choices = selectedScenario.choices.map((choice, choiceIndex) => ({
      ...choice,
      ...(choiceIndex === index ? patch : {}),
      ...(patch.correct === true ? { correct: choiceIndex === index } : {}),
    }));
    changeScenario({ choices });
  }

  function addScenario() {
    const used = new Set(draft.scenarios.map((scenario) => scenario.id));
    const id = Array.from({ length: 100 }, (_, index) => index + 1).find((candidate) => !used.has(candidate));
    if (!id) {
      setStatus("Đã đạt giới hạn 100 tình huống.");
      return;
    }
    const scenario: Scenario = {
      id,
      title: "Tình huống mới",
      category: "Chưa phân loại",
      difficulty: "Dễ",
      channel: "Trực tuyến",
      icon: "◇",
      story: "Mô tả bối cảnh và thông tin người chơi nhận được.",
      redFlags: ["Dấu hiệu cảnh báo cần chú ý"],
      tip: "Mẹo an toàn người chơi cần ghi nhớ.",
      evidence: "Chứng cứ mới",
      choices: [
        { text: "Lựa chọn an toàn", correct: true, moneyDelta: 0, awarenessDelta: 5, feedback: "Đây là cách xử lý an toàn." },
        { text: "Lựa chọn rủi ro", correct: false, moneyDelta: -1000000, awarenessDelta: -10, feedback: "Lựa chọn này có thể gây thiệt hại." },
        { text: "Lựa chọn cần cân nhắc", correct: false, moneyDelta: 0, awarenessDelta: -5, feedback: "Cần xác minh thêm trước khi hành động." },
      ],
    };
    setDraft((current) => ({ ...current, scenarios: [...current.scenarios, scenario].sort((a, b) => a.id - b.id) }));
    setSelectedScenarioId(id);
    setTab("scenarios");
  }

  function removeScenario() {
    if (draft.scenarios.length === 1 || !selectedScenario) {
      setStatus("Website cần ít nhất một tình huống.");
      return;
    }
    if (!window.confirm(`Xóa tình huống “${selectedScenario.title}” khỏi bản nháp?`)) return;
    const remaining = draft.scenarios.filter((scenario) => scenario.id !== selectedScenario.id);
    setDraft((current) => ({ ...current, scenarios: remaining }));
    setSelectedScenarioId(remaining[0].id);
  }

  function changeKnowledge(index: number, patch: Partial<KnowledgeCard>) {
    setDraft((current) => ({
      ...current,
      knowledgeCards: current.knowledgeCards.map((card, cardIndex) => cardIndex === index ? { ...card, ...patch } : card),
    }));
  }

  function addKnowledge() {
    setDraft((current) => ({
      ...current,
      knowledgeCards: [...current.knowledgeCards, { icon: "◇", title: "Nội dung mới", text: "Nhập nội dung hướng dẫn an toàn." }],
    }));
  }

  function removeKnowledge(index: number) {
    if (draft.knowledgeCards.length === 1) {
      setStatus("Cẩm nang cần ít nhất một nội dung.");
      return;
    }
    setDraft((current) => ({ ...current, knowledgeCards: current.knowledgeCards.filter((_, cardIndex) => cardIndex !== index) }));
  }

  async function save(target: "draft" | "publish") {
    if (!account) return;
    const normalized = normalizeSiteContent(draft);
    if (!normalized) {
      setStatus("Nội dung chưa hợp lệ. Mỗi tình huống cần đúng 3 lựa chọn và chỉ 1 đáp án đúng.");
      return;
    }
    setBusy(true);
    setStatus(target === "publish" ? "Đang xuất bản…" : "Đang lưu bản nháp…");
    const now = new Date().toISOString();
    const draftResult = await supabase.from("site_content").upsert({
      slug: "main-draft",
      content: normalized,
      published: false,
      updated_by: account.id,
      updated_at: now,
    }, { onConflict: "slug" });
    if (draftResult.error) {
      setBusy(false);
      setStatus("Không thể lưu. Vui lòng kiểm tra quyền quản trị và cấu hình cơ sở dữ liệu.");
      return;
    }
    if (target === "publish") {
      const publishResult = await supabase.from("site_content").upsert({
        slug: "main",
        content: normalized,
        published: true,
        updated_by: account.id,
        updated_at: now,
      }, { onConflict: "slug" });
      if (publishResult.error) {
        setBusy(false);
        setStatus("Bản nháp đã lưu nhưng chưa thể xuất bản.");
        return;
      }
      setPublished(cloneContent(normalized));
      onPublished(normalized);
      setStatus("Đã xuất bản nội dung mới. Người dùng tải lại trang sẽ thấy thay đổi.");
    } else {
      setStatus("Đã lưu bản nháp. Nội dung công khai chưa thay đổi.");
    }
    setUpdatedAt(now);
    setBusy(false);
  }

  if (!account) return <AdminGate title="Đăng nhập để quản trị nội dung" detail="Trang này chỉ dành cho tài khoản được IT Security cấp quyền quản trị." action={onLogin} />;
  if (access === "checking") return <AdminGate title="Đang kiểm tra quyền quản trị…" detail="Vui lòng chờ trong giây lát." />;
  if (access === "forbidden") return <AdminGate title="Tài khoản chưa có quyền quản trị" detail="Quyền được kiểm tra trực tiếp trên máy chủ. Hãy liên hệ quản trị viên hệ thống để được cấp quyền." />;
  if (access === "error") return <AdminGate title="Chưa thể mở trang quản trị" detail="Hãy kiểm tra kết nối và bảo đảm migration quản trị nội dung đã được áp dụng." />;

  return (
    <section className="content-page admin-page">
      <div className="admin-heading">
        <div><span className="eyebrow">KHIÊN SỐ · QUẢN TRỊ NỘI DUNG</span><h1>Trung tâm nội dung</h1><p>Chỉnh sửa bản nháp, rà soát và xuất bản nội dung cho toàn bộ website.</p></div>
        <div className="admin-actions"><button className="admin-secondary" disabled={busy} onClick={() => { setDraft(cloneContent(published)); setStatus("Đã khôi phục bản nháp từ nội dung đang xuất bản."); }}>Khôi phục bản đã đăng</button><button className="admin-secondary" disabled={busy} onClick={() => void save("draft")}>Lưu bản nháp</button><button className="primary-button" disabled={busy} onClick={() => void save("publish")}>Xuất bản</button></div>
      </div>
      <div className="admin-meta"><span><b>Quản trị viên:</b> {account.displayName} · {account.email}</span><span><b>Cập nhật gần nhất:</b> {updatedAt ? new Date(updatedAt).toLocaleString("vi-VN") : "Chưa có"}</span></div>
      {status && <div className="admin-status" role="status" aria-live="polite">{status}</div>}
      <div className="admin-tabs" role="tablist" aria-label="Nhóm nội dung">
        <button role="tab" aria-selected={tab === "general"} className={tab === "general" ? "active" : ""} onClick={() => setTab("general")}>Nội dung chung</button>
        <button role="tab" aria-selected={tab === "scenarios"} className={tab === "scenarios" ? "active" : ""} onClick={() => setTab("scenarios")}>Tình huống ({draft.scenarios.length})</button>
        <button role="tab" aria-selected={tab === "knowledge"} className={tab === "knowledge" ? "active" : ""} onClick={() => setTab("knowledge")}>Cẩm nang ({draft.knowledgeCards.length})</button>
      </div>

      {tab === "general" && <div className="admin-form-grid">
        {([
          ["productName", "Tên sản phẩm"], ["departmentName", "Tên đơn vị"], ["libraryEyebrow", "Nhãn thư viện"],
          ["libraryTitle", "Tiêu đề thư viện"], ["coachEyebrow", "Nhãn thẻ ghi nhớ"], ["knowledgeEyebrow", "Nhãn cẩm nang"],
          ["knowledgeTitle", "Tiêu đề cẩm nang"], ["knowledgeIntro", "Giới thiệu cẩm nang"], ["dashboardEyebrow", "Nhãn Dashboard"],
          ["dashboardTitle", "Tiêu đề Dashboard"], ["dashboardIntro", "Giới thiệu Dashboard"], ["footerTagline", "Dòng giới thiệu chân trang"],
          ["footerNotice", "Thông báo chân trang"],
        ] as Array<[keyof SiteContent["copy"], string]>).map(([key, label]) => <label key={key} className={key.endsWith("Intro") || key === "footerNotice" ? "admin-wide" : ""}><span>{label}</span>{key.endsWith("Intro") || key === "footerNotice" ? <textarea value={draft.copy[key]} onChange={(event) => changeCopy(key, event.target.value)} /> : <input value={draft.copy[key]} onChange={(event) => changeCopy(key, event.target.value)} />}</label>)}
      </div>}

      {tab === "scenarios" && selectedScenario && <div className="scenario-admin-layout">
        <aside className="admin-list"><div className="admin-list-heading"><strong>Danh sách tình huống</strong><button onClick={addScenario}>+ Thêm</button></div>{draft.scenarios.map((scenario) => <button className={scenario.id === selectedScenario.id ? "active" : ""} key={scenario.id} onClick={() => setSelectedScenarioId(scenario.id)}><span>{String(scenario.id).padStart(2, "0")}</span><b>{scenario.title}</b></button>)}</aside>
        <div className="scenario-admin-form">
          <div className="admin-section-title"><div><span className="eyebrow">TÌNH HUỐNG {String(selectedScenario.id).padStart(2, "0")}</span><h2>{selectedScenario.title}</h2></div><button className="danger-link" onClick={removeScenario}>Xóa tình huống</button></div>
          <div className="admin-form-grid compact">
            <label className="admin-wide"><span>Tiêu đề</span><input value={selectedScenario.title} onChange={(event) => changeScenario({ title: event.target.value })} /></label>
            <label><span>Kênh</span><input value={selectedScenario.channel} onChange={(event) => changeScenario({ channel: event.target.value })} /></label>
            <label><span>Danh mục</span><input value={selectedScenario.category} onChange={(event) => changeScenario({ category: event.target.value })} /></label>
            <label><span>Độ khó</span><select value={selectedScenario.difficulty} onChange={(event) => changeScenario({ difficulty: event.target.value as Difficulty })}>{difficultyOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Biểu tượng</span><input value={selectedScenario.icon} maxLength={12} onChange={(event) => changeScenario({ icon: event.target.value })} /></label>
            <label className="admin-wide"><span>Bối cảnh</span><textarea rows={5} value={selectedScenario.story} onChange={(event) => changeScenario({ story: event.target.value })} /></label>
            <label className="admin-wide"><span>Dấu hiệu cảnh báo — mỗi dòng một dấu hiệu</span><textarea rows={4} value={selectedScenario.redFlags.join("\n")} onChange={(event) => changeScenario({ redFlags: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label>
            <label className="admin-wide"><span>Mẹo ghi nhớ</span><textarea value={selectedScenario.tip} onChange={(event) => changeScenario({ tip: event.target.value })} /></label>
            <label className="admin-wide"><span>Tên chứng cứ</span><input value={selectedScenario.evidence} onChange={(event) => changeScenario({ evidence: event.target.value })} /></label>
          </div>
          <div className="choice-editor"><h3>Các lựa chọn</h3>{selectedScenario.choices.map((choice, index) => <article key={index} className={choice.correct ? "correct" : ""}><div className="choice-editor-head"><strong>Lựa chọn {String.fromCharCode(65 + index)}</strong><label><input type="radio" name="correct-choice" checked={choice.correct} onChange={() => changeChoice(index, { correct: true })} /> Đáp án đúng</label></div><label><span>Nội dung lựa chọn</span><textarea value={choice.text} onChange={(event) => changeChoice(index, { text: event.target.value })} /></label><div className="choice-numbers"><label><span>Thay đổi tài sản</span><input type="number" value={choice.moneyDelta} onChange={(event) => changeChoice(index, { moneyDelta: Number(event.target.value) })} /></label><label><span>Thay đổi cảnh giác</span><input type="number" value={choice.awarenessDelta} onChange={(event) => changeChoice(index, { awarenessDelta: Number(event.target.value) })} /></label></div><label><span>Phản hồi giải thích</span><textarea value={choice.feedback} onChange={(event) => changeChoice(index, { feedback: event.target.value })} /></label></article>)}</div>
        </div>
      </div>}

      {tab === "knowledge" && <div className="knowledge-admin"><div className="admin-section-title"><div><span className="eyebrow">CẨM NANG AN TOÀN</span><h2>Thẻ kiến thức</h2></div><button className="admin-secondary" onClick={addKnowledge}>+ Thêm thẻ</button></div><div className="knowledge-admin-grid">{draft.knowledgeCards.map((card, index) => <article key={index}><div className="knowledge-admin-head"><b>{String(index + 1).padStart(2, "0")}</b><button onClick={() => removeKnowledge(index)} aria-label={`Xóa ${card.title}`}>×</button></div><label><span>Biểu tượng</span><input value={card.icon} maxLength={12} onChange={(event) => changeKnowledge(index, { icon: event.target.value })} /></label><label><span>Tiêu đề</span><input value={card.title} onChange={(event) => changeKnowledge(index, { title: event.target.value })} /></label><label><span>Nội dung</span><textarea rows={5} value={card.text} onChange={(event) => changeKnowledge(index, { text: event.target.value })} /></label></article>)}</div></div>}
    </section>
  );
}

function AdminGate({ title, detail, action }: { title: string; detail: string; action?: () => void }) {
  return <section className="content-page admin-page"><div className="dashboard-gate admin-gate"><span className="admin-lock" aria-hidden="true">◆</span><h1>{title}</h1><p>{detail}</p>{action && <button className="primary-button" onClick={action}>Đăng nhập</button>}</div></section>;
}
