import { Brain, Building2, CalendarDays, CheckCircle2, FileText, GraduationCap, Grid2X2, Heart, Send, Scale, ShieldCheck, UserCircle2 } from "lucide-react";
import { t } from "../i18n.js";

const items = [
  { key: "universities", label: "Universități", icon: GraduationCap },
  { key: "documents", label: "Documente", icon: FileText },
  { key: "compare", label: "Compară", icon: Scale },
  { key: "calendar", label: "Calendar", icon: CalendarDays }
];

export function Sidebar({ active, onChange, counts, user, language = "ro" }) {
  const initials = user?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AM";
  const roleLabel = user?.role === "admin" ? "Admin" : user?.role === "university" ? "Universitate" : "Profil";
  const openUniversities = (status) => onChange("universities", status ? { status } : undefined);

  if (user?.role === "admin" || user?.role === "university") {
    return (
      <aside className="sidebar">
        <div className="sidebar-brand">
          <ShieldCheck size={30} />
          <strong>UniTrack</strong>
        </div>
        <p className="sidebar-title">{t(user.role === "admin" ? "Administrare" : "Workspace admitere", language)}</p>
        <button className={`side-link ${active === "dashboard" ? "active" : ""}`} type="button" onClick={() => onChange("dashboard")}>
          <Building2 size={18} />
          {t(user.role === "admin" ? "Panou Admin" : "Aplicații primite", language)}
        </button>
        <button className={`profile-link ${active === "profile" ? "active" : ""}`} type="button" onClick={() => onChange("profile")}>
          <UserCircle2 size={18} />
          <span>{t(roleLabel, language)}</span>
          <strong>{initials}</strong>
          <small>{user?.name}<br />{user?.email}</small>
        </button>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <ShieldCheck size={30} />
        <strong>UniTrack</strong>
      </div>
      <p className="sidebar-title">{t("Aplicațiile mele", language)}</p>
      <button className={`side-link ${active === "dashboard" ? "active" : ""}`} type="button" onClick={() => onChange("dashboard")}>
        <Grid2X2 size={18} />
        {t("Toate", language)}
        <span>{counts.total || 0}</span>
      </button>
      <button className="side-link" type="button" onClick={() => openUniversities("Wishlist")}>
        <Heart size={18} />
        Wishlist
        <span>{counts.wishlist || 0}</span>
      </button>
      <button className="side-link" type="button" onClick={() => openUniversities("Aplicat")}>
        <Send size={18} />
        {t("Aplicate", language)}
        <span>{counts.applied || 0}</span>
      </button>
      <button className="side-link" type="button" onClick={() => openUniversities("Acceptat")}>
        <CheckCircle2 size={18} />
        {t("Acceptate", language)}
        <span>{counts.accepted || 0}</span>
      </button>
      <div className="side-divider" />
      <p className="sidebar-title">{t("Unelte", language)}</p>
      <button className={`side-link ${active === "admissions" ? "active" : ""}`} type="button" onClick={() => onChange("admissions")}>
        <Building2 size={18} />
        {t("Admitere", language)}
      </button>
      <button className={`side-link ${active === "advisor" ? "active" : ""}`} type="button" onClick={() => onChange("advisor")}>
        <Brain size={18} />
        {t("Asistent dosar", language)}
      </button>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.key} className={`side-link ${active === item.key ? "active" : ""}`} type="button" onClick={() => onChange(item.key)}>
            <Icon size={18} />
            {t(item.label, language)}
          </button>
        );
      })}
      <button className={`profile-link ${active === "profile" ? "active" : ""}`} type="button" onClick={() => onChange("profile")}>
        <UserCircle2 size={18} />
        <span>{t("Profil", language)}</span>
        <strong>{initials}</strong>
        <small>{user?.name}<br />{user?.email}</small>
      </button>
    </aside>
  );
}
