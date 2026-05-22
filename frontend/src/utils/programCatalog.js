const defaultPrograms = [
  { faculty: "Facultatea de Științe", program: "Informatică", programType: "licenta" },
  { faculty: "Facultatea de Științe", program: "Inteligență Artificială", programType: "master" },
  { faculty: "Facultatea de Științe", program: "Cercetare doctorală", programType: "doctorat" }
];

const programsByShortName = {
  UB: [
    { faculty: "Facultatea de Matematică și Informatică", program: "Informatică", programType: "licenta" },
    { faculty: "Facultatea de Matematică și Informatică", program: "Calculatoare și Tehnologia Informației", programType: "licenta" },
    { faculty: "Facultatea de Matematică și Informatică", program: "Artificial Intelligence", programType: "master" },
    { faculty: "Facultatea de Drept", program: "Drept", programType: "licenta" }
  ],
  UTCN: [
    { faculty: "Facultatea de Automatică și Calculatoare", program: "Calculatoare și Tehnologia Informației", programType: "licenta" },
    { faculty: "Facultatea de Automatică și Calculatoare", program: "Automatică și Informatică Aplicată", programType: "licenta" },
    { faculty: "Facultatea de Electronică, Telecomunicații și Tehnologia Informației", program: "Electronică Aplicată", programType: "licenta" },
    { faculty: "Facultatea de Automatică și Calculatoare", program: "Sisteme Distribuite", programType: "master" }
  ],
  UPB: [
    { faculty: "Facultatea de Automatică și Calculatoare", program: "Automatică și Informatică Aplicată", programType: "licenta" },
    { faculty: "Facultatea de Automatică și Calculatoare", program: "Calculatoare și Tehnologia Informației", programType: "licenta" },
    { faculty: "Facultatea de Electronică, Telecomunicații și Tehnologia Informației", program: "Ingineria Informației", programType: "licenta" }
  ],
  UBB: [
    { faculty: "Facultatea de Matematică și Informatică", program: "Informatică", programType: "licenta" },
    { faculty: "Facultatea de Matematică și Informatică", program: "Inteligență Artificială", programType: "master" },
    { faculty: "Facultatea de Științe Economice", program: "Informatică Economică", programType: "licenta" }
  ],
  ASE: [
    { faculty: "Facultatea de Cibernetică, Statistică și Informatică Economică", program: "Informatică Economică", programType: "licenta" },
    { faculty: "Facultatea de Cibernetică, Statistică și Informatică Economică", program: "Cibernetică Economică", programType: "licenta" },
    { faculty: "Facultatea de Business și Turism", program: "Administrarea Afacerilor", programType: "licenta" }
  ],
  TU: [
    { faculty: "Faculty of Electrical Engineering", program: "Computer Science & Engineering", programType: "licenta" },
    { faculty: "Faculty of Electrical Engineering", program: "Computer Engineering", programType: "master" },
    { faculty: "Faculty of Aerospace Engineering", program: "Aerospace Engineering", programType: "licenta" }
  ],
  KU: [
    { faculty: "Faculty of Engineering Science", program: "Master Artificial Intelligence", programType: "master" },
    { faculty: "Faculty of Engineering Science", program: "Computer Science", programType: "master" },
    { faculty: "Faculty of Science", program: "Mathematics", programType: "licenta" }
  ],
  UOE: [
    { faculty: "School of Informatics", program: "Artificial Intelligence", programType: "master" },
    { faculty: "School of Informatics", program: "Computer Science", programType: "licenta" },
    { faculty: "School of Informatics", program: "Data Science", programType: "master" }
  ],
  UAIC: [
    { faculty: "Facultatea de Informatică", program: "Informatică", programType: "licenta" },
    { faculty: "Facultatea de Informatică", program: "Software Engineering", programType: "master" },
    { faculty: "Facultatea de Economie și Administrarea Afacerilor", program: "Informatică Economică", programType: "licenta" }
  ],
  UVT: [
    { faculty: "Facultatea de Matematică și Informatică", program: "Informatică", programType: "licenta" },
    { faculty: "Facultatea de Matematică și Informatică", program: "Artificial Intelligence and Distributed Computing", programType: "master" },
    { faculty: "Facultatea de Economie și Administrare a Afacerilor", program: "Informatică Economică", programType: "licenta" }
  ]
};

function keyFor(institution = {}) {
  institution ||= {};
  const shortName = String(institution.shortName || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (programsByShortName[shortName]) return shortName;
  const name = String(institution.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (name.includes("BUCURESTI") && !name.includes("POLITEHNICA")) return "UB";
  if (name.includes("CLUJ")) return "UTCN";
  if (name.includes("POLITEHNICA")) return "UPB";
  if (name.includes("DELFT")) return "TU";
  if (name.includes("LEUVEN")) return "KU";
  if (name.includes("EDINBURGH")) return "UOE";
  if (name.includes("CUZA")) return "UAIC";
  if (name.includes("VEST")) return "UVT";
  return "";
}

export function getProgramsForInstitution(institution) {
  if (Array.isArray(institution?.offerPrograms) && institution.offerPrograms.length) {
    return institution.offerPrograms;
  }
  return programsByShortName[keyFor(institution)] || defaultPrograms;
}

export function programChoiceValue(option) {
  return `${option.id || option.programId || ""}|||${option.faculty}|||${option.program}|||${option.programType}`;
}
