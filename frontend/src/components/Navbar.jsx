import { useMemo, useState } from "react";
import { Bell, Languages, LogOut, Moon, Search, Sun } from "lucide-react";
import { t } from "../i18n.js";

const pageTitles = {
  dashboard: "Dashboard",
  admissions: "Admitere",
  advisor: "Consilier AI",
  universities: "Universități",
  documents: "Documente",
  compare: "Comparare",
  calendar: "Calendar",
  profile: "Profil"
};

export function Navbar({ user, active, onChange, onLogout, darkMode, onToggleTheme, language = "ro", onToggleLanguage, notifications = [], onMarkNotificationRead }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications]);
  const pageTitle = user?.role === "admin" && active === "dashboard"
    ? "Panou Admin"
    : user?.role === "university" && active === "dashboard"
      ? "Aplicații primite"
      : pageTitles[active] || "UniTrack";
  return (
    <header className="topbar">
      <div className="topbar-title">
        <span>{t("Navigare", language)}</span>
        <strong>{t(pageTitle, language)}</strong>
      </div>
      <div className="topbar-actions">
        {user?.role === "student" && (
          <button className="top-icon" type="button" title={t("Caută universități", language)} onClick={() => onChange("universities")}>
            <Search size={18} />
          </button>
        )}
        <div className="notification-wrap">
          <button
            className={`top-icon ${unreadCount ? "has-dot" : ""}`}
            type="button"
            title={t("Notificări", language)}
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>
          {notificationsOpen && (
            <section className="notification-panel" aria-label="Notificări">
              <header>
                <strong>{t("Notificări", language)}</strong>
                <small>{unreadCount ? `${unreadCount} ${t("necitite", language)}` : t("La zi", language)}</small>
              </header>
              {notifications.length === 0 ? (
                <p>{t("Nu ai notificări noi.", language)}</p>
              ) : (
                notifications.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    className={item.readAt ? "read" : ""}
                    type="button"
                    onClick={() => onMarkNotificationRead?.(item.id)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </button>
                ))
              )}
            </section>
          )}
        </div>
        <button className="top-icon" type="button" title={t(darkMode ? "Tema luminoasă" : "Tema întunecată", language)} onClick={onToggleTheme}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="top-icon language-button" type="button" title="RO / EN" onClick={onToggleLanguage}>
          <Languages size={17} />
          <span>{language === "ro" ? "EN" : "RO"}</span>
        </button>
        <button className="top-icon" type="button" title={t("Deconectare", language)} onClick={onLogout}>
          <LogOut size={18} />
        </button>
        <div className="top-avatar" title={user?.email}>{user?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AM"}</div>
      </div>
    </header>
  );
}
