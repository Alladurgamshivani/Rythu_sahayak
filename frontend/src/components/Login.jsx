import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { api } from "../services/api";
import { errorMessage, t } from "../i18n";

export default function Login({
  onLogin,
  language,
  onLanguageChange,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await api.login(username.trim(), password);
      onLogin(result);
    } catch (err) {
      setError(errorMessage(language, err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      {/* Left-side introduction */}
      <section className="login-showcase">
        <div className="brand-lockup">
          <span className="brand-mark">
            <Leaf size={24} />
          </span>

          <span>
            {t(language, "RythuSahayak", "రైతు సహాయక్")}
          </span>
        </div>

        <div className="showcase-copy">
          <span className="eyebrow">
            {t(
              language,
              "OFFICER REVIEW WORKSPACE",
              "అధికారుల దరఖాస్తుల సమీక్ష విభాగం"
            )}
          </span>

          <h1>
            {t(
              language,
              <>
                Review applications
                <br />
                with clarity.
              </>,
              <>
                దరఖాస్తుల సమీక్షను
                <br />
                సులభంగా చేయండి.
              </>
            )}
          </h1>

          <p>
            {t(
              language,
              "Document checks, record comparisons and AI assistance — the officer always makes the final decision.",
              "పత్రాల తనిఖీ, వివరాల పోలిక, AI సహాయం — తుది నిర్ణయం ఎల్లప్పుడూ అధికారిదే."
            )}
          </p>
        </div>

        <div className="showcase-bottom">
          <ShieldCheck size={18} />

          <span>
            {t(
              language,
              "Fictional sample data only · Not an official government service",
              "నమూనా డేటా మాత్రమే · అధికారిక ప్రభుత్వ సేవ కాదు"
            )}
          </span>
        </div>
      </section>

      {/* Right-side login form */}
      <section className="login-side">
        <form className="login-card" onSubmit={submit}>
          {/* Language selector */}
          <div
            className="language-switch"
            role="group"
            aria-label={t(
              language,
              "Choose language",
              "భాషను ఎంచుకోండి"
            )}
          >
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              aria-pressed={language === "en"}
              onClick={() => {
                setError("");
                onLanguageChange("en");
              }}
            >
              English
            </button>

            <button
              type="button"
              className={language === "te" ? "active" : ""}
              aria-pressed={language === "te"}
              onClick={() => {
                setError("");
                onLanguageChange("te");
              }}
            >
              తెలుగు
            </button>
          </div>

          <div className="login-icon">
            <LockKeyhole size={22} />
          </div>

          <h2>
            {t(
              language,
              "Officer sign in",
              "అధికారి లాగిన్"
            )}
          </h2>

          <p className="muted">
            {t(
              language,
              "Continue with your demo account.",
              "మీ డెమో ఖాతాతో కొనసాగించండి."
            )}
          </p>

          {/* Username */}
          <label htmlFor="username">
            {t(language, "Username", "వినియోగదారు పేరు")}
          </label>

          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          {/* Password */}
          <label htmlFor="password">
            {t(language, "Password", "పాస్‌వర్డ్")}
          </label>

          <div className="password-field">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              aria-label={t(
                language,
                showPassword ? "Hide password" : "Show password",
                showPassword
                  ? "పాస్‌వర్డ్ దాచండి"
                  : "పాస్‌వర్డ్ చూపించండి"
              )}
              aria-pressed={showPassword}
              title={t(
                language,
                showPassword ? "Hide password" : "Show password",
                showPassword
                  ? "పాస్‌వర్డ్ దాచండి"
                  : "పాస్‌వర్డ్ చూపించండి"
              )}
            >
              {showPassword ? (
                <>
                  <EyeOff size={18} />
                  <span>
                    {t(language, "Hide", "దాచు")}
                  </span>
                </>
              ) : (
                <>
                  <Eye size={18} />
                  <span>
                    {t(language, "Show", "చూపించు")}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Login error */}
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            className="button button-primary login-submit"
            disabled={loading}
            type="submit"
          >
            {loading
              ? t(language, "Signing in…", "ప్రవేశిస్తోంది…")
              : t(language, "Sign in", "లాగిన్ చేయండి")}

            <ArrowRight size={17} />
          </button>

          {/* Demo information */}
          <div className="login-note">
            <ShieldCheck size={16} />

            <span>
              {t(
                language,
                "This demo uses fictional application records only.",
                "ఈ నమూనా వెర్షన్‌లో కల్పిత దరఖాస్తులే ఉపయోగించబడతాయి."
              )}
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}