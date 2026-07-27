import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarDays, FileText, GraduationCap, LayoutDashboard, Plus, Scale, Search, Send, Sparkles, UserCircle2, X } from "lucide-react";
import { api } from "../services/api.js";

const pageItems = [
  { key: "dashboard", label: "Dashboard", hint: "Rezumat, deadline-uri și progres", icon: LayoutDashboard, roles: ["student", "admin", "university"] },
  { key: "admissions", label: "Admitere", hint: "Trimite aplicații și verifică documente", icon: Send, roles: ["student"] },
  { key: "advisor", label: "Asistent dosar", hint: "Primești recomandări pentru aplicații", icon: Sparkles, roles: ["student"] },
  { key: "universities", label: "Universități", hint: "Catalog, tracker și comparație rapidă", icon: GraduationCap, roles: ["student"] },
  { key: "documents", label: "Documente", hint: "Checklist-ul pentru fiecare aplicație", icon: FileText, roles: ["student"] },
  { key: "compare", label: "Comparare", hint: "Alege 2-4 universități side-by-side", icon: Scale, roles: ["student"] },
  { key: "calendar", label: "Calendar", hint: "Deadline-uri și planificare", icon: CalendarDays, roles: ["student"] },
  { key: "profile", label: "Profil", hint: "Date personale, poză, securitate", icon: UserCircle2, roles: ["student", "admin", "university"] }
];

function initials(university) {
  return university.shortName || university.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 4).toUpperCase();
}

function matches(item, query) {
  if (!query) return true;
  const haystack = [item.label, item.hint, item.name, item.program, item.faculty, item.country, item.offerSummary, ...(item.strengths || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function CommandPalette({ open, user, universities = [], onClose, onNavigate, onAdd, onToast }) {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open || user?.role !== "student") return;
    let active = true;
    api.catalog(query)
      .then((data) => {
        if (active) setCatalog(data.universities || []);
      })
      .catch((error) => onToast?.(error.message));
    return () => {
      active = false;
    };
  }, [open, query, user?.role, onToast]);

  useEffect(() => {
    if (!open) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  const pages = useMemo(() => pageItems
    .filter((item) => item.roles.includes(user?.role || "student") && matches(item, query))
    .slice(0, 8), [query, user?.role]);

  const tracked = useMemo(() => universities
    .filter((item) => matches(item, query))
    .slice(0, query ? 6 : 4), [query, universities]);

  const catalogMatches = useMemo(() => catalog
    .filter((item) => matches(item, query))
    .slice(0, query ? 8 : 5), [catalog, query]);

  if (!open) return null;

  function runNavigation(page, options) {
    onNavigate(page, options);
    onClose();
  }

  function openAddFlow() {
    if (user?.role === "university") {
      runNavigation("dashboard");
      return;
    }
    onAdd();
    onClose();
  }

  return (
    <div className="command-backdrop" role="presentation" onPointerDown={onClose}>
      <section className="command-panel" role="dialog" aria-modal="true" aria-label="Căutare UniTrack" onPointerDown={(event) => event.stopPropagation()}>
        <header className="command-search">
          <Search size={18} />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută pagini, universități, programe..." />
          <button type="button" onClick={onClose} aria-label="Închide">
            <X size={18} />
          </button>
        </header>

        <div className="command-content">
          <section className="command-section">
            <span>Acțiuni rapide</span>
            <div className="command-grid">
              {user?.role === "student" && (
                <>
                  <button type="button" onClick={() => runNavigation("universities", { view: "catalog", query })}>
                    <GraduationCap size={17} />
                    <strong>Caută în catalog</strong>
                    <small>{query ? `Filtrează după "${query}"` : "Top Europa + România"}</small>
                  </button>
                  <button type="button" onClick={() => runNavigation("compare")}>
                    <Scale size={17} />
                    <strong>Compară universități</strong>
                    <small>Scoruri, taxe, deadline-uri</small>
                  </button>
                </>
              )}
              <button type="button" onClick={openAddFlow}>
                <Plus size={17} />
                <strong>{user?.role === "admin" ? "Adaugă universitate" : user?.role === "student" ? "Trimite aplicație" : "Vezi aplicații"}</strong>
                <small>Deschide fluxul principal</small>
              </button>
            </div>
          </section>

          {pages.length > 0 && (
            <section className="command-section">
              <span>Pagini</span>
              {pages.map((item) => {
                const Icon = item.icon;
                return (
                  <button className="command-row" type="button" key={item.key} onClick={() => runNavigation(item.key)}>
                    <Icon size={18} />
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                    <ArrowRight size={16} />
                  </button>
                );
              })}
            </section>
          )}

          {user?.role === "student" && tracked.length > 0 && (
            <section className="command-section">
              <span>Trackerul meu</span>
              {tracked.map((item) => (
                <button className="command-row" type="button" key={item.id} onClick={() => runNavigation("universities", { view: "tracker", query: item.name })}>
                  <i className="uni-logo mini tone-primary">{initials(item)}</i>
                  <strong>{item.name}</strong>
                  <small>{item.program} · {item.progress || 0}% documente</small>
                  <ArrowRight size={16} />
                </button>
              ))}
            </section>
          )}

          {user?.role === "student" && catalogMatches.length > 0 && (
            <section className="command-section">
              <span>Catalog public</span>
              {catalogMatches.map((item) => (
                <button className="command-row" type="button" key={`${item.name}-${item.city || item.country}`} onClick={() => runNavigation("universities", { view: "catalog", query: item.name, catalogItem: item })}>
                  <i className="uni-logo mini tone-primary">{initials(item)}</i>
                  <strong>{item.name}</strong>
                  <small>{item.country}{item.city ? ` · ${item.city}` : ""} · {item.offerSummary || "Ofertă educațională"}</small>
                  <ArrowRight size={16} />
                </button>
              ))}
            </section>
          )}

          {!pages.length && !tracked.length && !catalogMatches.length && (
            <div className="command-empty">
              <Search size={22} />
              <strong>Niciun rezultat</strong>
              <span>Încearcă numele unei universități, o țară sau un program.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
