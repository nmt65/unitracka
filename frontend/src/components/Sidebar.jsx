import { useEffect, useState } from "react";
import { Brain, Building2, CalendarDays, CheckCircle2, ChevronRight, FileText, GraduationCap, Grid2X2, Heart, Menu, Send, Scale, ShieldCheck, UserCircle2, X } from "lucide-react";
import { t } from "../i18n.js";

const items = [
  { key: "universities", label: "Universități", icon: GraduationCap },
  { key: "documents", label: "Documente", icon: FileText },
  { key: "compare", label: "Compară", icon: Scale },
  { key: "calendar", label: "Calendar", icon: CalendarDays }
];

function ProfileGlyph({ user }) {
  if (user?.avatarDataUrl) {
    return (
      <i className="sidebar-photo" aria-hidden="true">
        <img src={user.avatarDataUrl} alt="" />
      </i>
    );
  }
  return <UserCircle2 size={18} />;
}

function SidebarBrand() {
  return (
    <div className="sidebar-brand">
      <span className="sidebar-brand-mark"><ShieldCheck size={24} /></span>
      <span className="sidebar-brand-copy">
        <strong>UniTrack</strong>
        <small>Admissions OS</small>
      </span>
    </div>
  );
}

function SidebarAccount({ active, onChange, user, language }) {
  const roleLabel = user?.role === "admin"
    ? t("Administrator", language)
    : user?.role === "university"
      ? t("Universitate", language)
      : t("Student", language);

  return (
    <button
      className={`sidebar-account ${active === "profile" ? "active" : ""}`}
      type="button"
      onClick={() => onChange("profile")}
      aria-current={active === "profile" ? "page" : undefined}
    >
      <span className="sidebar-account-avatar"><ProfileGlyph user={user} /></span>
      <span className="sidebar-account-copy">
        <strong>{user?.name || t("Profil", language)}</strong>
        <small>{roleLabel}</small>
      </span>
      <ChevronRight size={16} />
    </button>
  );
}

function MobileStudentNav({ active, onChange, counts, user, language }) {
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [active]);

  function go(page, options) {
    onChange(page, options);
    setMoreOpen(false);
  }

  const moreActive = ["advisor", "compare", "calendar", "profile"].includes(active);

  return (
    <>
      {moreOpen && <button className="mobile-nav-backdrop" type="button" aria-label={t("Închide meniul", language)} onClick={() => setMoreOpen(false)} />}
      {moreOpen && (
        <section className="mobile-nav-sheet" aria-label={t("Mai multe opțiuni", language)}>
          <header>
            <div>
              <strong>{t("Navigare", language)}</strong>
              <small>{user?.name}</small>
            </div>
            <button type="button" aria-label={t("Închide meniul", language)} onClick={() => setMoreOpen(false)}><X size={19} /></button>
          </header>
          <div className="mobile-status-shortcuts">
            <button type="button" onClick={() => go("universities", { status: "Wishlist" })}><Heart size={17} /> Wishlist <span>{counts.wishlist || 0}</span></button>
            <button type="button" onClick={() => go("universities", { status: "Aplicat" })}><Send size={17} /> {t("Aplicate", language)} <span>{counts.applied || 0}</span></button>
            <button type="button" onClick={() => go("universities", { status: "Acceptat" })}><CheckCircle2 size={17} /> {t("Acceptate", language)} <span>{counts.accepted || 0}</span></button>
          </div>
          <div className="mobile-more-grid">
            <button className={active === "advisor" ? "active" : ""} type="button" onClick={() => go("advisor")}><Brain size={19} /><span>{t("Asistent dosar", language)}</span></button>
            <button className={active === "compare" ? "active" : ""} type="button" onClick={() => go("compare")}><Scale size={19} /><span>{t("Compară", language)}</span></button>
            <button className={active === "calendar" ? "active" : ""} type="button" onClick={() => go("calendar")}><CalendarDays size={19} /><span>{t("Calendar", language)}</span></button>
            <button className={active === "profile" ? "active" : ""} type="button" onClick={() => go("profile")}><ProfileGlyph user={user} /><span>{t("Profil", language)}</span></button>
          </div>
        </section>
      )}
      <nav className="mobile-nav" aria-label={t("Navigare principală", language)}>
        <button className={active === "dashboard" ? "active" : ""} type="button" onClick={() => go("dashboard")}><Grid2X2 size={19} /><span>{t("Acasă", language)}</span></button>
        <button className={active === "admissions" ? "active" : ""} type="button" onClick={() => go("admissions")}><Building2 size={19} /><span>{t("Admitere", language)}</span></button>
        <button className={active === "universities" ? "active" : ""} type="button" onClick={() => go("universities")}><GraduationCap size={19} /><span>{t("Universități", language)}</span></button>
        <button className={active === "documents" ? "active" : ""} type="button" onClick={() => go("documents")}><FileText size={19} /><span>{t("Documente", language)}</span></button>
        <button className={moreOpen || moreActive ? "active" : ""} type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}><Menu size={19} /><span>{t("Mai mult", language)}</span></button>
      </nav>
    </>
  );
}

export function Sidebar({ active, onChange, counts, user, language = "ro" }) {
  const openUniversities = (status) => onChange("universities", status ? { status } : undefined);

  if (user?.role === "admin" || user?.role === "university") {
    return (
      <>
        <aside className="sidebar">
          <SidebarBrand />
          <p className="sidebar-title">{t(user.role === "admin" ? "Administrare" : "Workspace admitere", language)}</p>
          <button className={`side-link ${active === "dashboard" ? "active" : ""}`} type="button" onClick={() => onChange("dashboard")}>
            <Building2 size={18} />
            {t(user.role === "admin" ? "Panou Admin" : "Aplicații primite", language)}
          </button>
          <SidebarAccount active={active} onChange={onChange} user={user} language={language} />
        </aside>
        <nav className="mobile-nav mobile-nav-compact" aria-label={t("Navigare principală", language)}>
          <button className={active === "dashboard" ? "active" : ""} type="button" onClick={() => onChange("dashboard")}><Building2 size={19} /><span>{t(user.role === "admin" ? "Panou Admin" : "Aplicații", language)}</span></button>
          <button className={active === "profile" ? "active" : ""} type="button" onClick={() => onChange("profile")}><ProfileGlyph user={user} /><span>{t("Profil", language)}</span></button>
        </nav>
      </>
    );
  }

  return (
    <>
      <aside className="sidebar">
        <SidebarBrand />
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
        <SidebarAccount active={active} onChange={onChange} user={user} language={language} />
      </aside>
      <MobileStudentNav
        active={active}
        onChange={onChange}
        counts={counts}
        user={user}
        language={language}
      />
    </>
  );
}
