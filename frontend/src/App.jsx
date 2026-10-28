import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BookOpenText, LogOut, Search, Sprout, X } from "lucide-react";
import Login from "./components/Login";
import Dashboard, { StatusPill } from "./components/Dashboard";
import ApplicationDetails from "./components/ApplicationDetails";
import { api } from "./services/api";
import { errorMessage, t } from "./i18n";

function ApplicationTable({ items, selectedId, onSelect, loading, language }) {
  const attentionLabels = {
    mismatch: ["Record mismatch", "రికార్డు వ్యత్యాసం"],
    missing: ["Missing document", "పత్రం లోపించింది"],
    unknown: ["Verification needed", "ధృవీకరణ అవసరం"],
    normal: ["No issue detected", "ప్రత్యేక సమస్య లేదు"],
  };
  return <div className="table-scroll"><table className="applications-table"><thead><tr>
    <th>{t(language, "Application", "దరఖాస్తు")}</th><th>{t(language, "Location", "స్థలం")}</th><th>{t(language, "Review flag", "పరిశీలన")}</th><th>{t(language, "Status", "స్థితి")}</th><th>{t(language, "Action", "చర్య")}</th>
  </tr></thead><tbody>
    {loading ? <tr><td colSpan="5" className="table-message">{t(language, "Loading applications…", "దరఖాస్తులు లోడ్ అవుతున్నాయి…")}</td></tr> : items.length === 0 ? <tr><td colSpan="5" className="table-message">{t(language, "No matching applications.", "సరిపోలే దరఖాస్తులు లేవు.")}</td></tr> : items.map((item) => {
      const needsAttention = item.status === "PENDING" && (item.missing_documents.length || item.inconsistencies.length || item.uncertainties.length);
      const attentionKey = item.inconsistencies.length ? "mismatch" : item.missing_documents.length ? "missing" : item.uncertainties.length ? "unknown" : "normal";
      const attentionText = attentionLabels[attentionKey][language === "te" ? 1 : 0];
      return <tr key={item.application_id} className={selectedId === item.application_id ? "selected-row" : ""}>
        <td><button className="app-id-button" onClick={() => onSelect(item.application_id)}><strong>{item.application_id}</strong><span>{item.applicant_name}</span></button></td>
        <td><strong className="location-main">{item.village}</strong><span className="table-secondary">{item.mandal}, {item.district}</span></td>
        <td>{needsAttention ? <span className={`attention-text ${item.priority.toLowerCase()}`}><AlertTriangle size={14} />{attentionText}</span> : <span className="normal-text">{attentionText}</span>}</td>
        <td><StatusPill status={item.status} language={language} /></td>
        <td><button className="button button-small button-outline" onClick={() => onSelect(item.application_id)}>{t(language, "Open", "తెరవండి")}</button></td>
      </tr>;
    })}
  </tbody></table></div>;
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("rythu_access_token"));
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [language, setLanguage] = useState(() => localStorage.getItem("rythu_language") === "te" ? "te" : "en");

  function changeLanguage(value) {
    setLanguage(value);
    localStorage.setItem("rythu_language", value);
  }

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const signOut = useCallback(() => {
    sessionStorage.removeItem("rythu_access_token");
    setToken(null);
    setUser(null);
    setDashboard(null);
    setItems([]);
    setSelectedId(null);
  }, []);

  useEffect(() => {
    const onExpired = () => signOut();
    window.addEventListener("rythu-session-expired", onExpired);
    return () => window.removeEventListener("rythu-session-expired", onExpired);
  }, [signOut]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [stats, applicationResponse] = await Promise.all([
        api.dashboard(language),
        api.applications({ search, status, attentionOnly, language }),
      ]);
      setDashboard(stats);
      setItems(applicationResponse.items || []);
      setError("");
    } catch (err) {
      setError(errorMessage(language, err));
    } finally {
      setLoading(false);
    }
  }, [token, search, status, attentionOnly, language]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    api.me().then((profile) => { if (active) setUser(profile); }).catch((err) => { if (active) setError(errorMessage(language, err)); });
    return () => { active = false; };
  }, [token, language]);

  useEffect(() => { refresh(); }, [refresh]);

  function handleLogin(result) {
    sessionStorage.setItem("rythu_access_token", result.access_token);
    setToken(result.access_token);
    setUser({ username: result.username, role: result.role });
  }

  function selectApplication(id) {
    setSelectedId(id);
    setActiveSection("applications");
    window.setTimeout(() => document.getElementById("application-details")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  }

  if (!token) return <Login onLogin={handleLogin} language={language} onLanguageChange={changeLanguage} />;

  return <div className="app-layout">
    <aside className="sidebar">
      <div className="sidebar-brand"><span className="brand-mark"><Sprout size={23} /></span><div><strong>{t(language, "RythuSahayak", "రైతు సహాయక్")}</strong><small>{t(language, "OFFICER WORKSPACE", "అధికారుల విభాగం")}</small></div></div>
      <div className="sidebar-section-label">{t(language, "MAIN MENU", "ప్రధాన మెను")}</div>
      <button className={`nav-link ${activeSection === "dashboard" ? "active" : ""}`} onClick={() => { setActiveSection("dashboard"); setAttentionOnly(false); document.getElementById("dashboard-top")?.scrollIntoView({ behavior: "smooth" }); }}><BookOpenText size={18} /> {t(language, "Dashboard", "డాష్‌బోర్డ్")}</button>
      <button className={`nav-link ${activeSection === "applications" ? "active" : ""}`} onClick={() => { setActiveSection("applications"); document.getElementById("applications-section")?.scrollIntoView({ behavior: "smooth" }); }}><Search size={18} /> {t(language, "Applications", "దరఖాస్తులు")} <span className="nav-count">{dashboard?.pending ?? "—"}</span></button>
      <button className={`nav-link ${attentionOnly ? "active" : ""}`} onClick={() => { setAttentionOnly((value) => !value); setActiveSection("applications"); document.getElementById("applications-section")?.scrollIntoView({ behavior: "smooth" }); }}><AlertTriangle size={18} /> {t(language, "Needs attention", "ప్రత్యేక పరిశీలన")} <span className="nav-count warning-count">{dashboard?.needs_attention ?? "—"}</span></button>
      <div className="sidebar-bottom"><div className="sidebar-demo-note"><ShieldIcon /><div><strong>{t(language, "Demo environment", "డెమో వాతావరణం")}</strong><small>{t(language, "All records are fictional", "అన్ని రికార్డులు కల్పితం")}</small></div></div><div className="user-row"><div className="user-avatar">{language === "en" ? "O" : "అ"}</div><div className="user-info"><strong>{user?.username || t(language, "Officer", "అధికారి")}</strong><small>{t(language, "Demo officer", "డెమో అధికారి")}</small></div><button className="logout-icon" title={t(language, "Sign out", "లాగ్ అవుట్")} onClick={signOut}><LogOut size={17} /></button></div></div>
    </aside>

    <main className="main-content" id="dashboard-top">
      <header className="top-header"><div><div className="breadcrumb">{t(language, "Officer workspace", "అధికారుల విభాగం")} <span>/</span> <strong>{activeSection === "applications" ? t(language, "Applications", "దరఖాస్తులు") : t(language, "Dashboard", "డాష్‌బోర్డ్")}</strong></div><h1>{activeSection === "applications" ? t(language, "Application review", "దరఖాస్తుల సమీక్ష") : t(language, "Welcome, Officer", "నమస్కారం, అధికారి")}</h1><p>{activeSection === "applications" ? t(language, "Search, filter and review application details.", "దరఖాస్తులను వెతకండి, ఫిల్టర్ చేయండి మరియు వివరాలను పరిశీలించండి.") : t(language, "Review pending applications and identify cases that need attention first.", "పెండింగ్ దరఖాస్తులను సమీక్షించి, ముందుగా శ్రద్ధ అవసరమైన కేసులను గుర్తించండి.")}</p></div><div className="header-actions"><div className="language-switch compact-switch" role="group" aria-label={t(language, "Choose language", "భాషను ఎంచుకోండి")}><button type="button" className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button><button type="button" className={language === "te" ? "active" : ""} onClick={() => changeLanguage("te")}>తెలుగు</button></div><button className="header-logout" onClick={signOut}><LogOut size={16} /> {t(language, "Sign out", "లాగ్ అవుట్")}</button></div></header>
      <div className="content-wrap">
        {error && <div className="error-box global-error" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label={t(language, "Dismiss error", "దోష సందేశాన్ని మూసివేయండి")}><X size={16} /></button></div>}
        <Dashboard data={dashboard} onSelect={selectApplication} language={language} />

        <section className="applications-section" id="applications-section">
          <div className="section-heading application-section-heading"><div><h2>{t(language, "Applications", "దరఖాస్తుల జాబితా")}</h2><p>{t(language, "Open each case to review its details.", "ఒక్కో కేసు వివరాలను తెరిచి పరిశీలించండి")}</p></div><span className="result-count">{items.length} {t(language, "applications", "దరఖాస్తులు")}</span></div>
          <div className="table-controls"><div className="search-box"><Search size={17} /><input aria-label={t(language, "Search applications", "దరఖాస్తులను వెతకండి")} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t(language, "Search by ID, name or village", "ID, పేరు లేదా గ్రామం ద్వారా వెతకండి")} /></div><select aria-label={t(language, "Filter by status", "స్థితి ద్వారా ఫిల్టర్ చేయండి")} value={status} onChange={(e) => setStatus(e.target.value)}>{[["", t(language, "All statuses", "అన్ని స్థితులు")], ["PENDING", t(language, "Pending", "పెండింగ్")], ["APPROVED", t(language, "Approved", "ఆమోదించబడింది")], ["RETURNED", t(language, "Returned for correction", "సవరణకు పంపబడింది")], ["REJECTED", t(language, "Rejected", "తిరస్కరించబడింది")]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{attentionOnly && <button className="button button-small button-quiet" onClick={() => setAttentionOnly(false)}>{t(language, "Clear filter", "ఫిల్టర్ తొలగించు")} <X size={14} /></button>}</div>
          <div className="table-card"><ApplicationTable items={items} selectedId={selectedId} onSelect={selectApplication} loading={loading} language={language} /></div>
        </section>

        {selectedId && <ApplicationDetails key={selectedId} applicationId={selectedId} onClose={() => setSelectedId(null)} onUpdated={refresh} language={language} />}
        <footer className="app-footer"><span><Sprout size={15} /> {t(language, "RythuSahayak", "రైతు సహాయక్")}</span><span>{t(language, "AI recommendations are advisory; the officer makes the final decision.", "AI సూచన మాత్రమే — తుది నిర్ణయం అధికారిదే.")}</span><span>{t(language, "Sample data · Not an official government service", "నమూనా డేటా · అధికారిక ప్రభుత్వ సేవ కాదు")}</span></footer>
      </div>
    </main>
  </div>;
}

function ShieldIcon() {
  return <span className="demo-shield"><AlertTriangle size={17} /></span>;
}
