import { ShieldCheck } from "lucide-react";
import { useState } from "react";

const STORAGE_KEY = "unitrack-cookie-consent";

export function CookieBanner({ language = "ro" }) {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY));

  function choose(value) {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  const english = language === "en";

  return (
    <aside className="cookie-banner" aria-label={english ? "Cookie preferences" : "Preferințe cookies"}>
      <div className="cookie-banner-icon" aria-hidden="true">
        <ShieldCheck size={20} strokeWidth={1.8} />
      </div>
      <div className="cookie-banner-copy">
        <strong>{english ? "Privacy preferences" : "Preferințe de confidențialitate"}</strong>
        <p>
          {english
            ? "UniTrack uses an essential session cookie and local storage for interface preferences. No advertising cookies are used."
            : "UniTrack folosește un cookie esențial de sesiune și stocare locală pentru preferințele interfeței. Nu folosim cookies publicitare."}
        </p>
      </div>
      <div className="cookie-banner-actions">
        <button type="button" className="secondary-button" onClick={() => choose("refused")}>
          {english ? "Decline" : "Refuz"}
        </button>
        <button type="button" className="primary-button" onClick={() => choose("accepted")}>
          {english ? "Accept" : "Accept"}
        </button>
      </div>
    </aside>
  );
}
