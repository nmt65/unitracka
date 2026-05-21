const en = {
  "Dashboard": "Dashboard",
  "Admitere": "Admissions",
  "Consilier AI": "AI advisor",
  "Universități": "Universities",
  "Documente": "Documents",
  "Comparare": "Compare",
  "Compară": "Compare",
  "Calendar": "Calendar",
  "Profil": "Profile",
  "Admin": "Admin",
  "Aplicații primite": "Received applications",
  "Panou Admin": "Admin panel",
  "Workspace admitere": "Admissions workspace",
  "Administrare": "Administration",
  "Aplicațiile mele": "My applications",
  "Toate": "All",
  "Wishlist": "Wishlist",
  "Aplicate": "Applied",
  "Acceptate": "Accepted",
  "Unelte": "Tools",
  "Profilul meu": "My profile",
  "Profil universitate": "University profile",
  "Profil administrator": "Admin profile",
  "Informații cont": "Account information",
  "Nume afișat": "Display name",
  "Nume complet": "Full name",
  "Email": "Email",
  "Notificări": "Notifications",
  "Securitate cont": "Account security",
  "Parola curentă": "Current password",
  "Parola nouă": "New password",
  "Schimbă parola": "Change password",
  "Deconectare": "Sign out",
  "Zonă periculoasă": "Danger zone",
  "Șterge contul definitiv": "Delete account permanently",
  "Salvează cont": "Save account",
  "Salvează profil": "Save profile",
  "Workspace asociat": "Linked workspace",
  "Workspace admitere": "Admissions workspace",
  "Aplicații": "Applications",
  "De evaluat": "To review",
  "Acceptate": "Accepted",
  "Respinse": "Rejected",
  "De ce să vină studenții aici?": "Why should students choose this university?",
  "Prezentare scurtă": "Short pitch",
  "Link oficial": "Official link",
  "Email admitere": "Admissions email",
  "Salvează prezentarea": "Save pitch",
  "Vezi site oficial": "Open official site",
  "Toate statusurile": "All statuses",
  "Trimise": "Submitted",
  "În evaluare": "In review",
  "Cele mai noi": "Newest",
  "Cele mai vechi": "Oldest",
  "Scor admitere": "Admission score",
  "Status": "Status",
  "Trimite aplicație": "Submit application",
  "Universitate": "University",
  "Program / facultate": "Program / faculty",
  "Tip": "Type",
  "Facultate": "Faculty",
  "Note": "Notes",
  "Trimite către universitate": "Send to university",
  "Verificare document cu AI": "AI document verification",
  "Document": "Document",
  "Tip așteptat": "Expected type",
  "Atașează fișier": "Attach file",
  "Nume fișier": "File name",
  "Text extras / OCR": "Extracted text / OCR",
  "Verifică și adaugă": "Verify and add",
  "Vezi": "View",
  "Vezi document": "View document",
  "Document aplicant": "Applicant document",
  "Fișier": "File",
  "Neverificat": "Not verified",
  "Lipsă": "Missing",
  "Verificat": "Verified",
  "Respins": "Rejected",
  "Intră în cont": "Sign in",
  "Creează cont": "Create account",
  "Recuperare parolă": "Password recovery",
  "Resetare parolă": "Reset password",
  "Acces securizat": "Secure access",
  "Login": "Login",
  "Cont nou": "New account",
  "Student": "Student",
  "Universitate aprobată de admin": "Admin-approved university",
  "Parola": "Password",
  "Parolă pierdută": "Forgot password",
  "Caută universități": "Search universities",
  "Tema luminoasă": "Light theme",
  "Tema întunecată": "Dark theme",
  "Activează tema luminoasă": "Enable light theme",
  "Activează tema întunecată": "Enable dark theme",
  "Închide": "Close"
};

const ro = Object.fromEntries(Object.entries(en).map(([key, value]) => [value, key]));

function translateValue(value, language) {
  if (!value) return value;
  const dictionary = language === "en" ? en : ro;
  const trimmed = value.trim();
  const translated = dictionary[trimmed];
  if (!translated) return value;
  return value.replace(trimmed, translated);
}

function translateTree(root, language) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const nextValue = translateValue(node.nodeValue, language);
    if (nextValue !== node.nodeValue) node.nodeValue = nextValue;
  });
  root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach((element) => {
    ["placeholder", "title", "aria-label"].forEach((attribute) => {
      if (element.hasAttribute(attribute)) {
        const current = element.getAttribute(attribute);
        const next = translateValue(current, language);
        if (next !== current) element.setAttribute(attribute, next);
      }
    });
  });
}

export function applyDomLanguage(language) {
  const root = document.getElementById("root");
  if (!root) return () => {};
  document.documentElement.lang = language === "en" ? "en" : "ro";
  translateTree(root, language);
  const observer = new MutationObserver(() => translateTree(root, language));
  observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });
  return () => observer.disconnect();
}
