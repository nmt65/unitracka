import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, Inbox, Languages, LogOut, Moon, Search, Sun } from "lucide-react";
import { t } from "../i18n.js";

const pageTitles = {
  dashboard: "Dashboard",
  admissions: "Admitere",
  advisor: "Asistent dosar",
  universities: "Universități",
  documents: "Documente",
  compare: "Comparare",
  calendar: "Calendar",
  profile: "Profil"
};

export function Navbar({ user, active, onChange, onSearchUniversities, onLogout, darkMode, onToggleTheme, language = "ro", onToggleLanguage, notifications = [], onMarkNotificationRead }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications]);
  const latestNotifications = notifications.slice(0, 6);
  const initials = user?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AM";
  const pageTitle = user?.role === "admin" && active === "dashboard"
    ? "Panou Admin"
    : user?.role === "university" && active === "dashboard"
      ? "Aplicații primite"
      : pageTitles[active] || "UniTrack";

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    function closeOnOutsideClick(event) {
      if (!notificationRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span>{t("Navigare", language)}</span>
        <strong>{t(pageTitle, language)}</strong>
      </div>
      <div className="topbar-actions">
        {user?.role === "student" && (
          <button className="top-search-button" type="button" title={t("Caută universități", language)} aria-label={t("Caută universități", language)} onClick={onSearchUniversities}>
            <Search size={18} />
            <span>{t("Caută", language)}</span>
            <kbd>Ctrl K</kbd>
          </button>
        )}
        <div className="notification-wrap" ref={notificationRef}>
          <button
            className={`top-icon ${unreadCount ? "has-dot" : ""}`}
            type="button"
            title={t("Notificări", language)}
            aria-label={t("Notificări", language)}
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>
          {notificationsOpen && (
            <section className="notification-panel" aria-label="Notificări">
              <header>
                <span className="notification-title">
                  <Inbox size={16} />
                  <strong>{t("Notificări", language)}</strong>
                </span>
                <small>{unreadCount ? `${unreadCount} ${t("necitite", language)}` : t("La zi", language)}</small>
              </header>
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <Inbox size={22} />
                  <p>{t("Nu ai notificări noi.", language)}</p>
                </div>
              ) : (
                latestNotifications.map((item) => (
                  <button
                    key={item.id}
                    className={item.readAt ? "read" : ""}
                    type="button"
                    onClick={() => onMarkNotificationRead?.(item.id)}
                  >
                    <span className={`notification-dot tone-${item.type || "system"}`} />
                    <span>
                      <strong>{item.title}</strong>
                      <em>{item.body}</em>
                      <small>{item.createdAt ? new Date(item.createdAt).toLocaleString("ro-RO") : t("Acum", language)}</small>
                    </span>
                  </button>
                ))
              )}
              {notifications.length > 0 && (
                <footer>
                  <button
                    className="notification-footer-action"
                    type="button"
                    onClick={() => latestNotifications.filter((item) => !item.readAt).forEach((item) => onMarkNotificationRead?.(item.id))}
                    disabled={!unreadCount}
                  >
                    <CheckCheck size={15} /> {t("Marchează citite", language)}
                  </button>
                </footer>
              )}
            </section>
          )}
        </div>
        <button
          className="top-icon"
          type="button"
          title={t(darkMode ? "Tema luminoasă" : "Tema întunecată", language)}
          aria-label={t(darkMode ? "Tema luminoasă" : "Tema întunecată", language)}
          onClick={onToggleTheme}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="top-icon language-button" type="button" title="RO / EN" aria-label={t("Schimbă limba", language)} onClick={onToggleLanguage}>
          <Languages size={17} />
          <span>{language === "ro" ? "EN" : "RO"}</span>
        </button>
        <button className="top-icon" type="button" title={t("Deconectare", language)} aria-label={t("Deconectare", language)} onClick={onLogout}>
          <LogOut size={18} />
        </button>
        <button
          className={`top-avatar ${active === "profile" ? "active" : ""}`}
          type="button"
          title={`${t("Profil", language)} · ${user?.email || ""}`}
          aria-label={t("Deschide profilul", language)}
          aria-current={active === "profile" ? "page" : undefined}
          onClick={() => onChange?.("profile")}
        >
          {user?.avatarDataUrl ? <img src={user.avatarDataUrl} alt="" /> : initials}
        </button>
      </div>
    </header>
  );
}
