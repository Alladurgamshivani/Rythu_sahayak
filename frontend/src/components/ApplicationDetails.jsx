import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileSearch, History, LoaderCircle, Sparkles, ShieldAlert, X } from "lucide-react";
import { api } from "../services/api";
import { StatusPill } from "./Dashboard";
import { actionLabel, errorMessage, statusLabel, t } from "../i18n";

const documentLabels = {
  identity_proof: ["Identity proof", "గుర్తింపు పత్రం"],
  land_proof: ["Land record proof", "భూమి రుజువు పత్రం"],
  bank_proof: ["Bank proof", "బ్యాంక్ రుజువు పత్రం"],
};

export default function ApplicationDetails({ applicationId, onClose, onUpdated, language = "en" }) {
  const [item, setItem] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("RETURN_FOR_CORRECTION");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDetails() {
    setLoading(true);
    setError("");
    try {
      const [application, decisionHistory] = await Promise.all([
        api.application(applicationId, language),
        api.history(applicationId),
      ]);
      setItem(application);
      setHistory(decisionHistory.items || []);
    } catch (err) {
      setError(errorMessage(language, err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
    // The parent keys this component by application ID, so state resets when another record opens.
    // On a language change, re-fetch only the localized record fields and preserve any unsaved reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, language]);

  // Analysis must be requested again after changing languages so its explanation matches the UI.
  useEffect(() => { setAnalysis(null); }, [language]);

  async function analyze() {
    setAnalyzing(true);
    setError("");
    setSuccess("");
    try {
      const result = await api.analyze(applicationId, language);
      setAnalysis(result);
    } catch (err) {
      setError(errorMessage(language, err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function submitDecision(event) {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      setError(t(language, "Please enter a reason with at least 5 characters.", "దయచేసి కనీసం 5 అక్షరాలతో కారణాన్ని నమోదు చేయండి."));
      return;
    }
    const confirmed = window.confirm(`${t(language, "Save this decision?", "ఈ నిర్ణయాన్ని నమోదు చేయాలా?")}

${actionLabel(language, action)}
${trimmedReason}`);
    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.decide(applicationId, action, trimmedReason);
      setSuccess(t(language, "Decision saved successfully.", "నిర్ణయం విజయవంతంగా సేవ్ చేయబడింది."));
      setReason("");
      await loadDetails();
      await onUpdated();
    } catch (err) {
      setError(errorMessage(language, err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="details-panel loading-card"><LoaderCircle className="spin" size={20} /> {t(language, "Loading application details…", "దరఖాస్తు వివరాలు లోడ్ అవుతున్నాయి…")}</section>;
  if (error && !item) return <section className="details-panel"><div className="error-box">{error}</div><button className="button button-quiet" onClick={onClose}>{t(language, "Close", "మూసివేయి")}</button></section>;
  if (!item) return null;

  return (
    <section className="details-panel" id="application-details">
      <div className="details-topbar">
        <div className="details-title-wrap"><div className="details-heading-icon"><FileSearch size={21} /></div><div><span className="eyebrow">{t(language, "APPLICATION REVIEW", "దరఖాస్తుల సమీక్ష")}</span><h2>{t(language, "Application details", "దరఖాస్తు వివరాలు")}</h2></div></div>
        <button className="icon-button" onClick={onClose} aria-label={t(language, "Close details", "వివరాలను మూసివేయండి")}><X size={19} /></button>
      </div>

      {error && <div className="error-box" role="alert">{error}</div>}
      {success && <div className="success-box" role="status"><CheckCircle2 size={17} />{success}</div>}

      <div className="detail-grid">
        <div className="detail-main-column">
          <article className="subpanel">
            <div className="applicant-heading"><div className="avatar">{item.applicant_name?.slice(0, 1) || "A"}</div><div className="applicant-copy"><span className="application-number">{item.application_id}</span><h3>{item.applicant_name}</h3><p>{item.village}, {item.mandal}, {item.district}</p></div><StatusPill status={item.status} language={language} /></div>
            <div className="detail-facts">
              <div><span>{t(language, "Land extent in application", "దరఖాస్తు భూమి విస్తీర్ణం")}</span><strong>{item.application_land_extent ?? t(language, "Unknown", "తెలియదు")} {item.application_land_extent == null ? "" : t(language, "units", "యూనిట్లు")}</strong></div>
              <div><span>{t(language, "Verified land extent", "ధృవీకరించిన విస్తీర్ణం")}</span><strong>{item.verified_land_extent ?? t(language, "Not verified", "ధృవీకరణ లేదు")}{item.verified_land_extent == null ? "" : ` ${t(language, "units", "యూనిట్లు")}`}</strong></div>
              <div><span>{t(language, "Application date", "దరఖాస్తు తేదీ")}</span><strong>{item.created_at ? new Date(item.created_at).toLocaleDateString(language === "te" ? "te-IN" : "en-IN") : "—"}</strong></div>
            </div>
            {item.notes && <div className="notes-box"><strong>{t(language, "Notes", "గమనికలు")}</strong><p>{item.notes}</p></div>}
          </article>

          <article className="subpanel">
            <div className="subpanel-heading"><div><h3>{t(language, "Document checklist", "పత్రాల తనిఖీ")}</h3><p>{t(language, "Illustrative demo checklist; not an official requirement list.", "నమూనా చెక్‌లిస్ట్ — అధికారిక పత్రాల జాబితా కాదు")}</p></div><span className="mini-label">3 {t(language, "items", "అంశాలు")}</span></div>
            <div className="document-list">
              {Object.entries(documentLabels).map(([key, labels]) => {
                const value = item.documents?.[key];
                const known = value === true || value === false;
                const label = labels[language === "te" ? 1 : 0];
                const detail = value === true
                  ? t(language, "Recorded as present in checklist", "జాబితాలో అందుబాటులో ఉన్నట్లు నమోదు")
                  : value === false
                    ? t(language, "Recorded as missing in checklist", "జాబితాలో లోపించినట్లు నమోదు")
                    : t(language, "Status has not been recorded", "స్థితి నమోదు కాలేదు");
                const state = known ? (value ? t(language, "Present", "అందుబాటులో ఉంది") : t(language, "Missing", "లోపించింది")) : t(language, "Unknown", "తెలియదు");
                return <div className="document-row" key={key}><div className={`document-status-icon ${value === true ? "present" : value === false ? "missing" : "unknown"}`}>{value === true ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</div><div className="document-copy"><strong>{label}</strong><small>{detail}</small></div><span className={`document-state ${value === true ? "good" : value === false ? "warning" : "muted-state"}`}>{state}</span></div>;
              })}
            </div>
          </article>

          <article className="subpanel">
            <div className="subpanel-heading"><div><h3>{t(language, "AI assistance", "AI సహాయం")}</h3><p>{t(language, "Decision support only; review the underlying facts.", "పరిశీలనకు సహాయక సమాచారం మాత్రమే")}</p></div><div className="ai-badge"><Sparkles size={14} /> AI</div></div>
            <div className="ai-disclaimer"><ShieldAlert size={16} /><span>{t(language, "AI provides a recommendation; the officer makes the final decision.", "AI సూచన మాత్రమే — తుది నిర్ణయం అధికారిదే.")}</span></div>
            {!analysis ? <div className="analysis-empty"><div className="analysis-empty-icon"><Sparkles size={22} /></div><h4>{t(language, "Analyze this application", "దరఖాస్తును విశ్లేషించండి")}</h4><p>{t(language, "Review documents, land details and available information to generate a summary.", "పత్రాలు, భూమి వివరాలు మరియు అందుబాటులో ఉన్న సమాచారాన్ని పరిశీలించి సారాంశం పొందండి.")}</p><button className="button button-primary" onClick={analyze} disabled={analyzing}>{analyzing ? <><LoaderCircle size={16} className="spin" /> {t(language, "Analyzing…", "విశ్లేషిస్తోంది…")}</> : <><Sparkles size={16} /> {t(language, "Run AI analysis", "AI విశ్లేషణ ప్రారంభించు")}</>}</button></div> : (
              <div className="analysis-result">
                <div className="analysis-source-line"><span className={`source-dot ${analysis.analysis_source === "openai" ? "live" : "fallback"}`} />{analysis.analysis_source === "openai" ? t(language, "LLM summary", "LLM సారాంశం") : t(language, "Rule-based fallback", "నియమాల ఆధారిత ఫాల్‌బ్యాక్")}<span className="latency">{analysis.latency_ms} ms</span></div>
                <h4>{t(language, "Application summary", "దరఖాస్తు సారాంశం")}</h4><p>{analysis.summary}</p>
                <div className="finding-block"><h4>{t(language, "Missing documents", "లోపించిన పత్రాలు")}</h4>{analysis.missing_documents.length ? <ul>{analysis.missing_documents.map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}</ul> : <p className="no-finding">{t(language, "No missing items found in the checklist.", "పత్రాల తనిఖీలో లోపించిన అంశాలు లేవు.")}</p>}</div>
                <div className="finding-block"><h4>{t(language, "Inconsistencies", "గుర్తించిన వ్యత్యాసాలు")}</h4>{analysis.inconsistencies.length ? <ul>{analysis.inconsistencies.map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}</ul> : <p className="no-finding">{t(language, "No known inconsistencies were detected.", "తెలిసిన వ్యత్యాసాలు గుర్తించబడలేదు.")}</p>}</div>
                {analysis.uncertainties.length > 0 && <div className="finding-block uncertainty"><h4>{t(language, "Items requiring verification", "ఇంకా ధృవీకరించాల్సినవి")}</h4><ul>{analysis.uncertainties.map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}</ul></div>}
                <div className="suggestion-box"><span>{t(language, "Suggested next action", "సూచించిన తదుపరి చర్య")}</span><strong>{actionLabel(language, analysis.suggested_action)}</strong><ul>{analysis.reasons.map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}</ul></div>
                <p className="small-disclaimer">{t(language, "This suggestion uses demo checks and does not establish official eligibility.", "ఈ సలహా నమూనా తనిఖీలపై ఆధారపడి ఉంటుంది. ఇది అధికారిక అర్హత నిర్ధారణ కాదు.")}</p>
                <button className="button button-quiet rerun-button" onClick={analyze} disabled={analyzing}>{analyzing ? t(language, "Analyzing again…", "మళ్లీ విశ్లేషిస్తోంది…") : t(language, "Run analysis again", "మళ్లీ విశ్లేషించు")}</button>
              </div>
            )}
          </article>
        </div>

        <aside className="detail-side-column">
          {item.status === "PENDING" ? <article className="subpanel decision-card"><div className="decision-card-heading"><div className="decision-heading-icon"><ShieldAlert size={18} /></div><div><h3>{t(language, "Officer decision", "అధికారి నిర్ణయం")}</h3><p>{t(language, "Record a decision after reviewing the evidence.", "సమీక్ష తర్వాత నిర్ణయం నమోదు చేయండి")}</p></div></div><form onSubmit={submitDecision} className="decision-form"><label htmlFor="decision-action">{t(language, "Decision", "నిర్ణయం")}</label><select id="decision-action" value={action} onChange={(e) => setAction(e.target.value)}><option value="APPROVE">{actionLabel(language, "APPROVE")}</option><option value="RETURN_FOR_CORRECTION">{actionLabel(language, "RETURN_FOR_CORRECTION")}</option><option value="REJECT">{actionLabel(language, "REJECT")}</option></select><label htmlFor="decision-reason">{t(language, "Reason for decision", "నిర్ణయానికి కారణం")} <span>*</span></label><textarea id="decision-reason" value={reason} onChange={(e) => setReason(e.target.value)} minLength={5} maxLength={1000} required placeholder={t(language, "Explain the reason clearly…", "కారణాన్ని స్పష్టంగా నమోదు చేయండి...")} /><small className="field-hint">{t(language, "Enter at least 5 characters.", "కనీసం 5 అక్షరాలు నమోదు చేయండి.")}</small><button type="submit" className="button button-primary full-width" disabled={saving}>{saving ? <><LoaderCircle size={16} className="spin" /> {t(language, "Saving…", "సేవ్ అవుతోంది...")}</> : t(language, "Save decision", "నిర్ణయాన్ని సేవ్ చేయండి")}</button><p className="decision-warning">{t(language, "After a decision is saved, this demo does not allow a second decision for the same application.", "సేవ్ చేసిన తర్వాత ఈ డెమోలో దరఖాస్తు తిరిగి సవరణకు పంపే వరకు కొత్త నిర్ణయం ఇవ్వలేరు.")}</p></form></article> : <article className="subpanel completed-card"><CheckCircle2 size={22} /><h3>{t(language, "Decision recorded", "నిర్ణయం నమోదు అయింది")}</h3><p>{t(language, "Current status:", "ప్రస్తుత స్థితి:")} <strong>{statusLabel(language, item.status)}</strong></p><p>{t(language, "This demo does not allow a new decision on an already reviewed application.", "ఈ డెమోలో ఇప్పటికే సమీక్షించిన దరఖాస్తులకు కొత్త నిర్ణయం ఇవ్వలేరు.")}</p></article>}

          <article className="subpanel history-card"><div className="subpanel-heading"><div><h3><History size={17} /> {t(language, "Decision history", "నిర్ణయ చరిత్ర")}</h3><p>{t(language, "Recorded officer actions", "భద్రపరిచిన అధికారి చర్యలు")}</p></div></div>{history.length === 0 ? <div className="empty-history">{t(language, "No decision history yet.", "ఇంకా నిర్ణయ చరిత్ర లేదు.")}</div> : <div className="history-list">{history.map((entry, index) => <div className="history-entry" key={`${entry.created_at}-${index}`}><span className="history-dot" /><div><strong>{actionLabel(language, entry.action)}</strong><small>{entry.officer_username}</small><p>{entry.reason}</p><time>{new Date(entry.created_at).toLocaleString(language === "te" ? "te-IN" : "en-IN")}</time></div></div>)}</div>}</article>
        </aside>
      </div>
    </section>
  );
}
