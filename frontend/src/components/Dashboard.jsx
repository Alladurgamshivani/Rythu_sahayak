import { AlertTriangle, CheckCircle2, ClipboardList, FileClock, RotateCcw, XCircle, ChevronRight } from "lucide-react";
import { statusLabel, t } from "../i18n";

const priorityLabels = {
  HIGH: ["High priority: record mismatch", "అధిక ప్రాధాన్యత: రికార్డు వ్యత్యాసం"],
  MEDIUM: ["Missing document", "పత్రం లేదు"],
  REVIEW: ["Verification required", "ధృవీకరణ అవసరం"],
  NORMAL: ["No issue detected", "సమస్య గుర్తించలేదు"],
};

export function StatusPill({ status, language = "en" }) {
  return <span className={`status-pill status-${String(status).toLowerCase()}`}>{statusLabel(language, status)}</span>;
}

export default function Dashboard({ data, onSelect, language = "en" }) {
  if (!data) return <div className="loading-card">{t(language, "Loading dashboard…", "డాష్‌బోర్డ్ లోడ్ అవుతోంది…")}</div>;

  const cards = [
    { label: t(language, "Total applications", "మొత్తం దరఖాస్తులు"), value: data.total, icon: ClipboardList, tone: "green", note: t(language, "Fictional records", "నమూనా రికార్డులు") },
    { label: t(language, "Pending review", "పెండింగ్"), value: data.pending, icon: FileClock, tone: "amber", note: t(language, "Waiting for review", "సమీక్ష కోసం వేచి ఉన్నాయి") },
    { label: t(language, "Needs attention", "ప్రత్యేక పరిశీలన"), value: data.needs_attention, icon: AlertTriangle, tone: "rose", note: t(language, "Review these first", "ముందుగా చూడాల్సినవి") },
    { label: t(language, "Approved", "ఆమోదించినవి"), value: data.approved, icon: CheckCircle2, tone: "blue", note: t(language, "Recorded decisions", "నమోదైన నిర్ణయాలు") },
    { label: t(language, "Rejected", "తిరస్కరించినవి"), value: data.rejected, icon: XCircle, tone: "slate", note: t(language, "Recorded decisions", "నమోదైన నిర్ణయాలు") },
    { label: t(language, "Returned for correction", "సవరణకు పంపినవి"), value: data.returned, icon: RotateCcw, tone: "violet", note: t(language, "Recorded decisions", "నమోదైన నిర్ణయాలు") },
  ];

  return (
    <section className="dashboard-section">
      <div className="section-heading"><div><h2>{t(language, "Current overview", "ఈరోజు స్థితి")}</h2><p>{t(language, "A quick overview of application reviews", "అప్లికేషన్ల సమీక్షపై ఒక చూపు")}</p></div><span className="data-chip">{t(language, "SAMPLE DATA", "కల్పిత డేటా")}</span></div>
      <div className="stats-grid">
        {cards.map(({ label, value, icon: Icon, tone, note }) => (
          <article className="stat-card" key={label}>
            <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
            <p className="stat-label">{label}</p>
            <strong className="stat-value">{value ?? 0}</strong>
            <span className="stat-note">{note}</span>
          </article>
        ))}
      </div>
      <div className="attention-card">
        <div className="attention-header"><div className="attention-title-icon"><AlertTriangle size={19} /></div><div><h3>{t(language, "Applications to review first", "ముందుగా పరిశీలించాల్సిన దరఖాస్తులు")}</h3><p>{t(language, "Pending cases with missing documents, mismatches or unverified information", "నమూనా తనిఖీల్లో సమస్యలు లేదా తెలియని వివరాలు కనిపించిన పెండింగ్ కేసులు")}</p></div></div>
        {!data.attention_items?.length ? <div className="empty-state compact">{t(language, "No pending applications currently need special attention.", "ప్రత్యేక పరిశీలన అవసరమైన పెండింగ్ దరఖాస్తులు లేవు.")}</div> : (
          <div className="attention-list">
            {data.attention_items.map((item) => (
              <button type="button" className="attention-row" key={item.application_id} onClick={() => onSelect(item.application_id)}>
                <span className="attention-id">{item.application_id}</span>
                <span className="attention-person"><strong>{item.applicant_name}</strong><small>{item.village}, {item.mandal}</small></span>
                <span className={`priority-pill priority-${item.priority.toLowerCase()}`}>{(priorityLabels[item.priority] || [item.priority, item.priority])[language === "te" ? 1 : 0]}</span>
                <ChevronRight size={18} className="row-chevron" />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
