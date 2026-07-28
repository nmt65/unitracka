import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { api } from "./services/api.js";
import { useAuth } from "./hooks/useAuth.js";
import { useUniversities } from "./hooks/useUniversities.js";
import { AuthPage } from "./pages/AuthPage.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { CommandPalette } from "./components/CommandPalette.jsx";
import { Navbar } from "./components/Navbar.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { UniversityModal } from "./components/UniversityModal.jsx";
import { applyDomLanguage } from "./i18n.js";

const AdminPanel = lazy(() => import("./pages/AdminPanel.jsx").then((module) => ({ default: module.AdminPanel })));
const Admissions = lazy(() => import("./pages/Admissions.jsx").then((module) => ({ default: module.Admissions })));
const Calendar = lazy(() => import("./pages/Calendar.jsx").then((module) => ({ default: module.Calendar })));
const Compare = lazy(() => import("./pages/Compare.jsx").then((module) => ({ default: module.Compare })));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx").then((module) => ({ default: module.Dashboard })));
const Documents = lazy(() => import("./pages/Documents.jsx").then((module) => ({ default: module.Documents })));
const Profile = lazy(() => import("./pages/Profile.jsx").then((module) => ({ default: module.Profile })));
const StudentAdvisor = lazy(() => import("./pages/StudentAdvisor.jsx").then((module) => ({ default: module.StudentAdvisor })));
const Universities = lazy(() => import("./pages/Universities.jsx").then((module) => ({ default: module.Universities })));
const UniversityWorkspace = lazy(() => import("./pages/UniversityWorkspace.jsx").then((module) => ({ default: module.UniversityWorkspace })));

const pagesByRole = {
  student: new Set(["dashboard", "admissions", "advisor", "universities", "documents", "compare", "calendar", "profile"]),
  university: new Set(["dashboard", "profile"]),
  admin: new Set(["dashboard", "profile"])
};

export function App() {
  const { user, setUser, checking, login, register, logout } = useAuth();
  const { universities, stats, loading, refresh } = useUniversities(Boolean(user));
  const [active, setActive] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("unitrack-theme") === "dark");
  const [language, setLanguage] = useState(() => localStorage.getItem("unitrack-language") || "ro");
  const [notifications, setNotifications] = useState([]);
  const [serverNotice, setServerNotice] = useState("");
  const [universitySearchFocus, setUniversitySearchFocus] = useState(0);
  const [universityNavigationIntent, setUniversityNavigationIntent] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState(() => (
    new URLSearchParams(window.location.search).has("reset_token") ? "login" : ""
  ));

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("unitrack-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    let stopped = false;
    async function keepApiAwake() {
      try {
        await api.health?.();
        if (!stopped) setServerNotice("");
      } catch {
        if (!stopped && user) setServerNotice("Serverul se trezește mai greu. Reîncercăm automat.");
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
    if (!user) return undefined;
    function openCommand(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }
    document.addEventListener("keydown", openCommand);
    return () => document.removeEventListener("keydown", openCommand);
  }, [user]);

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

  function jumpToUniversitySearch() {
    setActive("universities");
    setUniversityNavigationIntent({ view: "catalog", nonce: Date.now() });
    setUniversitySearchFocus(Date.now());
  }

  function handleTopSearch() {
    if (active === "universities") {
      jumpToUniversitySearch();
      return;
    }
    setCommandOpen(true);
  }

  function navigate(page, options = {}) {
    if (page === "universities") {
      setUniversityNavigationIntent({ ...options, nonce: Date.now() });
    }
    setActive(page);
  }

  function commandNavigate(page, options = {}) {
    navigate(page, options);
    setCommandOpen(false);
  }

  if (!user) {
    if (!authEntry) {
      return (
        <LandingPage
          onLogin={() => setAuthEntry("login")}
          onRegister={() => setAuthEntry("register")}
        />
      );
    }
    return (
      <AuthPage
        onLogin={login}
        onRegister={register}
        onAuthenticated={setUser}
        checkingSession={checking}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((value) => !value)}
        language={language}
        onToggleLanguage={() => setLanguage((value) => value === "ro" ? "en" : "ro")}
        initialMode={authEntry}
        onBack={() => setAuthEntry("")}
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
    onManageUniversities: () => navigate("universities"),
    onNavigate: navigate,
    onRefresh: refresh,
    onToast: setToast
  };

  return (
    <div className="app-shell">
      {serverNotice && <div className="connection-banner" role="status">{serverNotice}</div>}
      <Navbar
        user={user}
        active={active}
        onSearchUniversities={handleTopSearch}
        onOpenCommand={() => setCommandOpen(true)}
        onLogout={logout}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((value) => !value)}
        language={language}
        onToggleLanguage={() => setLanguage((value) => value === "ro" ? "en" : "ro")}
        notifications={notifications}
        onMarkNotificationRead={markNotificationRead}
      />
      <div className="app-body">
        <Sidebar active={active} onChange={navigate} counts={counts} user={user} language={language} />
        <main className="content">
          {loading && <div className="loading-bar" />}
          <Suspense fallback={<div className="page-loader" role="status">Se încarcă...</div>}>
          {active === "dashboard" && user.role === "admin" && <AdminPanel onToast={setToast} />}
          {active === "dashboard" && user.role === "university" && <UniversityWorkspace user={user} onToast={setToast} />}
          {active === "dashboard" && user.role === "student" && <Dashboard {...pageProps} />}
          {active === "admissions" && user.role === "student" && <Admissions onToast={setToast} />}
          {active === "advisor" && user.role === "student" && <StudentAdvisor universities={universities} onToast={setToast} />}
          {active === "universities" && user.role === "student" && <Universities {...pageProps} searchFocusSignal={universitySearchFocus} navigationIntent={universityNavigationIntent} />}
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
          </Suspense>
        </main>
      </div>
      <CommandPalette
        open={commandOpen}
        user={user}
        universities={universities}
        onClose={() => setCommandOpen(false)}
        onNavigate={commandNavigate}
        onAdd={openAdd}
        onToast={setToast}
      />
      <UniversityModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSave={saveUniversity} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
