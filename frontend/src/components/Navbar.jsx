import { useMemo, useState } from "react";
import { Bell, ChevronLeft, Languages, LogOut, Moon, Search, Sun } from "lucide-react";

const studentNav = [
  { key: "dashboard", label: "Dashboard" },
  { key: "admissions", label: "Admitere" },
  { key: "advisor", label: "Consilier AI" },
  { key: "universities", label: "Universități" },
  { key: "documents", label: "Documente" },
  { key: "compare", label: "Comparare" }
];

export function Navbar({ user, active, onChange, onLogout, darkMode, onToggleTheme, language = "ro", onToggleLanguage, notifications = [], onMarkNotificationRead }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications]);
  const navItems = user?.role === "admin"
    ? [{ key: "dashboard", label: "Admin" }, { key: "profile", label: "Profil" }]
    : user?.role === "university"
      ? [{ key: "dashboard", label: "Aplicații primite" }, { key: "profile", label: "Profil" }]
      : studentNav;
  return (
    <header className="topbar">
      <button className="top-back" type="button" title="Înapoi la dashboard" onClick={() => (active === "dashboard" ? window.history.back() : onChange("dashboard"))}>
        <ChevronLeft size={18} />
      </button>
      <nav className="topnav" aria-label="Navigare principală">
        {navItems.map((item) => (
          <button key={item.key} className={active === item.key ? "active" : ""} type="button" onClick={() => onChange(item.key)}>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="topbar-actions">
        {user?.role === "student" && (
          <button className="top-icon" type="button" title="Caută universități" onClick={() => onChange("universities")}>
            <Search size={18} />
          </button>
        )}
        <div className="notification-wrap">
          <button
            className={`top-icon ${unreadCount ? "has-dot" : ""}`}
            type="button"
            title="Notificări"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((value) => !value)}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>
          {notificationsOpen && (
            <section className="notification-panel" aria-label="Notificări">
              <header>
                <strong>Notificări</strong>
                <small>{unreadCount ? `${unreadCount} necitite` : "La zi"}</small>
              </header>
              {notifications.length === 0 ? (
                <p>Nu ai notificări noi.</p>
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
        <button className="top-icon" type="button" title={darkMode ? "Light mode" : "Dark mode"} onClick={onToggleTheme}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="top-icon language-button" type="button" title="RO / EN" onClick={onToggleLanguage}>
          <Languages size={17} />
          <span>{language === "ro" ? "EN" : "RO"}</span>
        </button>
        <button className="top-icon" type="button" title="Deconectare" onClick={onLogout}>
          <LogOut size={18} />
        </button>
        <div className="top-avatar" title={user?.email}>{user?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AM"}</div>
      </div>
    </header>
  );
}
