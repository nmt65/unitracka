import { Brain, Building2, CalendarDays, CheckCircle2, FileText, GraduationCap, Grid2X2, Heart, Send, Scale, ShieldCheck, UserCircle2 } from "lucide-react";

const items = [
  { key: "universities", label: "Universități", icon: GraduationCap },
  { key: "documents", label: "Documente", icon: FileText },
  { key: "compare", label: "Compară", icon: Scale },
  { key: "calendar", label: "Calendar", icon: CalendarDays }
];

export function Sidebar({ active, onChange, counts, user }) {
  const initials = user?.name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AM";
  const roleLabel = user?.role === "admin" ? "Admin" : user?.role === "university" ? "Universitate" : "Profil";

  if (user?.role === "admin" || user?.role === "university") {
    return (
      <aside className="sidebar">
        <div className="sidebar-brand">
          <ShieldCheck size={30} />
          <strong>UniTrack</strong>
        </div>
        <p className="sidebar-title">{user.role === "admin" ? "Administrare" : "Workspace admitere"}</p>
        <button className={`side-link ${active === "dashboard" ? "active" : ""}`} type="button" onClick={() => onChange("dashboard")}>
          <Building2 size={18} />
          {user.role === "admin" ? "Panou Admin" : "Aplicații primite"}
        </button>
        <button className={`side-link ${active === "profile" ? "active" : ""}`} type="button" onClick={() => onChange("profile")}>
          <UserCircle2 size={18} />
          Profil
        </button>
        <button className={`profile-link ${active === "profile" ? "active" : ""}`} type="button" onClick={() => onChange("profile")}>
          <UserCircle2 size={18} />
          <span>{roleLabel}</span>
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
      <p className="sidebar-title">Aplicațiile mele</p>
      <button className={`side-link ${active === "dashboard" ? "active" : ""}`} type="button" onClick={() => onChange("dashboard")}>
        <Grid2X2 size={18} />
        Toate
        <span>{counts.total || 0}</span>
      </button>
      <button className="side-link" type="button" onClick={() => onChange("universities")}>
        <Heart size={18} />
        Wishlist
        <span>{counts.wishlist || 0}</span>
      </button>
      <button className="side-link" type="button" onClick={() => onChange("universities")}>
        <Send size={18} />
        Aplicate
        <span>{counts.applied || 0}</span>
      </button>
      <button className="side-link" type="button" onClick={() => onChange("profile")}>
        <CheckCircle2 size={18} />
        Acceptate
        <span>{counts.accepted || 0}</span>
      </button>
      <div className="side-divider" />
      <p className="sidebar-title">Unelte</p>
      <button className={`side-link ${active === "admissions" ? "active" : ""}`} type="button" onClick={() => onChange("admissions")}>
        <Building2 size={18} />
        Admitere
      </button>
      <button className={`side-link ${active === "advisor" ? "active" : ""}`} type="button" onClick={() => onChange("advisor")}>
        <Brain size={18} />
        Consilier AI
      </button>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.key} className={`side-link ${active === item.key ? "active" : ""}`} type="button" onClick={() => onChange(item.key)}>
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
      <button className={`profile-link ${active === "profile" ? "active" : ""}`} type="button" onClick={() => onChange("profile")}>
        <UserCircle2 size={18} />
        <span>Profil</span>
        <strong>{initials}</strong>
        <small>{user?.name}<br />{user?.email}</small>
      </button>
    </aside>
  );
}
