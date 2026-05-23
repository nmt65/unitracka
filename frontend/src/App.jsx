import { useEffect, useMemo, useState } from "react";
import { api } from "./services/api.js";
import { useAuth } from "./hooks/useAuth.js";
import { useUniversities } from "./hooks/useUniversities.js";
import { AdminPanel } from "./pages/AdminPanel.jsx";
import { Admissions } from "./pages/Admissions.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { Calendar } from "./pages/Calendar.jsx";
import { Compare } from "./pages/Compare.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Documents } from "./pages/Documents.jsx";
import { Profile } from "./pages/Profile.jsx";
import { PublicShare } from "./pages/PublicShare.jsx";
import { StudentAdvisor } from "./pages/StudentAdvisor.jsx";
import { Universities } from "./pages/Universities.jsx";
import { UniversityWorkspace } from "./pages/UniversityWorkspace.jsx";
import { Navbar } from "./components/Navbar.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { UniversityModal } from "./components/UniversityModal.jsx";
import { applyDomLanguage } from "./i18n.js";

const pagesByRole = {
  student: new Set(["dashboard", "admissions", "advisor", "universities", "documents", "compare", "calendar", "profile"]),
  university: new Set(["dashboard", "profile"]),
  admin: new Set(["dashboard", "profile"])
};

export function App() {
  const publicMatch = window.location.pathname.match(/(?:^|\/)public\/([^/]+)/);
  const { user, setUser, checking, login, register, logout } = useAuth();
  const { universities, stats, loading, refresh } = useUniversities(Boolean(user));
  const [active, setActive] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState(() => localStorage.getItem("unitrack-language") || "ro");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    let stopped = false;
    async function keepApiAwake() {
      try {
        await api.health?.();
      } catch {
        if (!stopped && user) setToast("Serverul pornește mai greu. Reîncercăm automat.");
      }
    }
    keepApiAwake();
    const timer = window.setInterval(keepApiAwake, 240000);
    const onVisible = () => {
      if (document.visibilityState === "visible") keepApiAwake();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem("unitrack-language", language);
    return applyDomLanguage(language);
  }, [language, active, user?.id, toast, notifications.length, universities.length]);

  useEffect(() => {
    if (user) setActive("dashboard");
  }, [user?.id, user?.role]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [active]);

  useEffect(() => {
    if (!user) return;
    const allowed = pagesByRole[user.role] || pagesByRole.student;
    if (!allowed.has(active)) setActive("dashboard");
  }, [active, user?.role]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    let activeSubscription = true;
    async function loadNotifications() {
      try {
        const data = await api.notifications();
        if (activeSubscription) setNotifications(data.notifications || []);
      } catch {
        if (activeSubscription) setNotifications([]);
      }
    }
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 45000);
    return () => {
      activeSubscription = false;
      window.clearInterval(timer);
    };
  }, [user?.id]);

  const counts = useMemo(() => ({
    total: universities.length,
    wishlist: universities.filter((uni) => uni.status === "Wishlist").length,
    applied: universities.filter((uni) => uni.status === "Aplicat").length,
    accepted: universities.filter((uni) => uni.status === "Acceptat").length
  }), [universities]);

  function openAdd() {
    if (user?.role !== "admin") {
      setActive("admissions");
      return;
    }
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(university) {
    setEditing(university);
    setModalOpen(true);
  }

  async function saveUniversity(payload) {
    if (user?.role !== "admin") {
      setToast("Doar adminul poate adăuga universități.");
      return;
    }
    if (editing) await api.updateUniversity(editing.id, payload);
    else await api.createUniversity(payload);
    setToast(editing ? "Universitate actualizata." : "Universitate adaugata.");
    await refresh();
  }

  async function deleteUniversity(university) {
    if (!window.confirm(`Stergi ${university.name}?`)) return;
    await api.deleteUniversity(university.id);
    setToast("Universitate stearsa.");
    await refresh();
  }

  async function toggleDocument(doc) {
    try {
      await api.updateDocument(doc.id, { isCompleted: !doc.isCompleted });
      await refresh();
    } catch (error) {
      setToast(error.message);
    }
  }

  async function addDocument(universityId, body) {
    await api.createDocument(universityId, body);
    setToast("Document adaugat.");
    await refresh();
  }

  async function deleteDocument(doc) {
    if (!window.confirm(`Stergi documentul ${doc.name}?`)) return;
    await api.deleteDocument(doc.id);
    setToast("Document sters.");
    await refresh();
  }

  async function markNotificationRead(id) {
    try {
      await api.markNotificationRead(id);
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    } catch (error) {
      setToast(error.message);
    }
  }

  if (publicMatch) {
    return <PublicShare shareId={publicMatch[1]} />;
  }

  if (!user) {
    return (
      <AuthPage
        onLogin={login}
        onRegister={register}
        checkingSession={checking}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((value) => !value)}
        language={language}
        onToggleLanguage={() => setLanguage((value) => value === "ro" ? "en" : "ro")}
      />
    );
  }

  const pageProps = {
    user,
    universities,
    stats,
    onAdd: openAdd,
    onEdit: openEdit,
    onDelete: deleteUniversity,
    onManageUniversities: () => setActive("universities"),
    onNavigate: setActive,
    onRefresh: refresh,
    onToast: setToast
  };

  return (
    <div className="app-shell">
      <Navbar
        user={user}
        active={active}
        onChange={setActive}
        onLogout={logout}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((value) => !value)}
        language={language}
        onToggleLanguage={() => setLanguage((value) => value === "ro" ? "en" : "ro")}
        notifications={notifications}
        onMarkNotificationRead={markNotificationRead}
      />
      <div className="app-body">
        <Sidebar active={active} onChange={setActive} counts={counts} user={user} language={language} />
        <main className="content">
          {loading && <div className="loading-bar" />}
          {active === "dashboard" && user.role === "admin" && <AdminPanel onToast={setToast} />}
          {active === "dashboard" && user.role === "university" && <UniversityWorkspace user={user} onToast={setToast} />}
          {active === "dashboard" && user.role === "student" && <Dashboard {...pageProps} />}
          {active === "admissions" && user.role === "student" && <Admissions onToast={setToast} />}
          {active === "advisor" && user.role === "student" && <StudentAdvisor universities={universities} onToast={setToast} />}
          {active === "universities" && user.role === "student" && <Universities {...pageProps} />}
          {active === "documents" && (
            <Documents
              universities={universities}
              onToggleDocument={toggleDocument}
              onAddDocument={addDocument}
              onDeleteDocument={deleteDocument}
            />
          )}
          {active === "compare" && user.role === "student" && <Compare universities={universities} onToast={setToast} onRefresh={refresh} />}
          {active === "calendar" && user.role === "student" && <Calendar universities={universities} onToast={setToast} />}
          {active === "profile" && <Profile user={user} universities={universities} stats={stats} onUser={setUser} onLogout={logout} onToast={setToast} />}
        </main>
      </div>
      <UniversityModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSave={saveUniversity} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
