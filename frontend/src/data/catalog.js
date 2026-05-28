const strengthsByType = {
  general: ["Computer Science", "Business", "Medicine", "Research"],
  technical: ["Computer Science", "Engineering", "Robotics", "AI"],
  medical: ["Medicine", "Pharmacy", "Research", "Public Health"],
  arts: ["Arts", "Design", "Media", "Performance"],
  economics: ["Business", "Economics", "Finance", "Data"],
  law: ["Law", "Public Policy", "Social Sciences", "Administration"],
  agronomy: ["Agronomy", "Veterinary Medicine", "Biotech", "Sustainability"]
};

export const currentAdmissionYear = "2026-2027";

const offerProgramsByType = {
  general: [
    { faculty: "Faculty of Science", program: "Computer Science", programType: "licenta" },
    { faculty: "Faculty of Business", program: "Business Administration", programType: "licenta" },
    { faculty: "Graduate School", program: "Data Science", programType: "master" }
  ],
  technical: [
    { faculty: "Faculty of Engineering", program: "Computer Science & Engineering", programType: "licenta" },
    { faculty: "Faculty of Engineering", program: "Artificial Intelligence", programType: "master" },
    { faculty: "Doctoral School", program: "Engineering Research", programType: "doctorat" }
  ],
  medical: [
    { faculty: "Faculty of Medicine", program: "Medicine", programType: "licenta" },
    { faculty: "Faculty of Pharmacy", program: "Pharmacy", programType: "licenta" },
    { faculty: "Graduate School", program: "Public Health", programType: "master" }
  ],
  arts: [
    { faculty: "Faculty of Arts", program: "Visual Arts", programType: "licenta" },
    { faculty: "Faculty of Design", program: "Design", programType: "licenta" },
    { faculty: "Graduate School", program: "Creative Industries", programType: "master" }
  ],
  economics: [
    { faculty: "Faculty of Economics", program: "Economics", programType: "licenta" },
    { faculty: "Faculty of Business", program: "Finance and Banking", programType: "licenta" },
    { faculty: "Graduate School", program: "Business Analytics", programType: "master" }
  ],
  law: [
    { faculty: "Faculty of Law", program: "Law", programType: "licenta" },
    { faculty: "Faculty of Public Administration", program: "Public Administration", programType: "licenta" },
    { faculty: "Graduate School", program: "Public Policy", programType: "master" }
  ],
  agronomy: [
    { faculty: "Faculty of Agriculture", program: "Agronomy", programType: "licenta" },
    { faculty: "Faculty of Veterinary Medicine", program: "Veterinary Medicine", programType: "licenta" },
    { faculty: "Graduate School", program: "Sustainable Food Systems", programType: "master" }
  ]
};

function acronym(name) {
  return name
    .replace(/["'()]/g, " ")
    .split(/\s+/)
    .filter((part) => !["of", "the", "and", "for", "de", "din", "si", "și", "la"].includes(part.toLowerCase()))
    .map((part) => part[0])
    .join("")
    .slice(0, 8)
    .toUpperCase();
}

function entry(item) {
  const type = item.type || "general";
  const offerPrograms = item.offerPrograms || offerProgramsByType[type] || offerProgramsByType.general;
  return {
    shortName: item.shortName || acronym(item.name),
    website: item.website || "",
    strengths: item.strengths || strengthsByType[type],
    type,
    academicYear: item.academicYear || currentAdmissionYear,
    offerPrograms,
    offerSummary: item.offerSummary || `Ofertă educațională ${currentAdmissionYear}: ${offerPrograms.map((program) => program.program).join(", ")}.`,
    qsBand: item.rank || item.source || "",
    ...item
  };
}

const europeTop2026 = [
  ["University of Oxford", "Marea Britanie", "GB", "Oxford", "https://www.ox.ac.uk"],
  ["University of Cambridge", "Marea Britanie", "GB", "Cambridge", "https://www.cam.ac.uk"],
  ["Imperial College London", "Marea Britanie", "GB", "London", "https://www.imperial.ac.uk", "technical"],
  ["ETH Zürich", "Elveția", "CH", "Zürich", "https://ethz.ch", "technical"],
  ["UCL", "Marea Britanie", "GB", "London", "https://www.ucl.ac.uk"],
  ["University of Edinburgh", "Marea Britanie", "GB", "Edinburgh", "https://www.ed.ac.uk", "technical"],
  ["Technical University of Munich", "Germania", "DE", "Munich", "https://www.tum.de", "technical"],
  ["LMU Munich", "Germania", "DE", "Munich", "https://www.lmu.de"],
  ["King's College London", "Marea Britanie", "GB", "London", "https://www.kcl.ac.uk"],
  ["EPFL", "Elveția", "CH", "Lausanne", "https://www.epfl.ch", "technical"],
  ["Université PSL", "Franța", "FR", "Paris", "https://psl.eu"],
  ["Karolinska Institute", "Suedia", "SE", "Stockholm", "https://ki.se", "medical"],
  ["KU Leuven", "Belgia", "BE", "Leuven", "https://www.kuleuven.be"],
  ["University of Manchester", "Marea Britanie", "GB", "Manchester", "https://www.manchester.ac.uk"],
  ["University of Amsterdam", "Olanda", "NL", "Amsterdam", "https://www.uva.nl"],
  ["Heidelberg University", "Germania", "DE", "Heidelberg", "https://www.uni-heidelberg.de"],
  ["Delft University of Technology", "Olanda", "NL", "Delft", "https://www.tudelft.nl", "technical"],
  ["Humboldt University of Berlin", "Germania", "DE", "Berlin", "https://www.hu-berlin.de"],
  ["Wageningen University & Research", "Olanda", "NL", "Wageningen", "https://www.wur.nl", "agronomy"],
  ["Erasmus University Rotterdam", "Olanda", "NL", "Rotterdam", "https://www.eur.nl", "economics"],
  ["Charité - Universitätsmedizin Berlin", "Germania", "DE", "Berlin", "https://www.charite.de", "medical"],
  ["University of Zurich", "Elveția", "CH", "Zürich", "https://www.uzh.ch"],
  ["Sorbonne University", "Franța", "FR", "Paris", "https://www.sorbonne-universite.fr"],
  ["Université Paris-Saclay", "Franța", "FR", "Paris-Saclay", "https://www.universite-paris-saclay.fr", "technical"],
  ["University of Birmingham", "Marea Britanie", "GB", "Birmingham", "https://www.birmingham.ac.uk"],
  ["University of Bristol", "Marea Britanie", "GB", "Bristol", "https://www.bristol.ac.uk"],
  ["University of Copenhagen", "Danemarca", "DK", "Copenhagen", "https://www.ku.dk"],
  ["University of Groningen", "Olanda", "NL", "Groningen", "https://www.rug.nl"],
  ["University of Sheffield", "Marea Britanie", "GB", "Sheffield", "https://www.sheffield.ac.uk"],
  ["University of Warwick", "Marea Britanie", "GB", "Coventry", "https://warwick.ac.uk"],
  ["Lund University", "Suedia", "SE", "Lund", "https://www.lunduniversity.lu.se"],
  ["Utrecht University", "Olanda", "NL", "Utrecht", "https://www.uu.nl"],
  ["RWTH Aachen University", "Germania", "DE", "Aachen", "https://www.rwth-aachen.de", "technical"],
  ["Aarhus University", "Danemarca", "DK", "Aarhus", "https://international.au.dk"],
  ["University of Bonn", "Germania", "DE", "Bonn", "https://www.uni-bonn.de"],
  ["University of Glasgow", "Marea Britanie", "GB", "Glasgow", "https://www.gla.ac.uk"],
  ["University of Leeds", "Marea Britanie", "GB", "Leeds", "https://www.leeds.ac.uk"],
  ["University of Southampton", "Marea Britanie", "GB", "Southampton", "https://www.southampton.ac.uk"],
  ["University of St Andrews", "Marea Britanie", "GB", "St Andrews", "https://www.st-andrews.ac.uk"],
  ["Trinity College Dublin", "Irlanda", "IE", "Dublin", "https://www.tcd.ie"],
  ["University of Twente", "Olanda", "NL", "Enschede", "https://www.utwente.nl", "technical"],
  ["University of Exeter", "Marea Britanie", "GB", "Exeter", "https://www.exeter.ac.uk"],
  ["Ghent University", "Belgia", "BE", "Ghent", "https://www.ugent.be"],
  ["London School of Hygiene & Tropical Medicine", "Marea Britanie", "GB", "London", "https://www.lshtm.ac.uk", "medical"],
  ["University of Nottingham", "Marea Britanie", "GB", "Nottingham", "https://www.nottingham.ac.uk"],
  ["Tilburg University", "Olanda", "NL", "Tilburg", "https://www.tilburguniversity.edu", "economics"],
  ["Technical University of Berlin", "Germania", "DE", "Berlin", "https://www.tu.berlin", "technical"],
  ["University of Vienna", "Austria", "AT", "Vienna", "https://www.univie.ac.at"],
  ["University of York", "Marea Britanie", "GB", "York", "https://www.york.ac.uk"],
  ["University College Dublin", "Irlanda", "IE", "Dublin", "https://www.ucd.ie"],
  ["Lancaster University", "Marea Britanie", "GB", "Lancaster", "https://www.lancaster.ac.uk"],
  ["Queen Mary University of London", "Marea Britanie", "GB", "London", "https://www.qmul.ac.uk"],
  ["Université Paris Cité", "Franța", "FR", "Paris", "https://u-paris.fr"],
  ["University of Tübingen", "Germania", "DE", "Tübingen", "https://uni-tuebingen.de"],
  ["Vrije Universiteit Amsterdam", "Olanda", "NL", "Amsterdam", "https://vu.nl"],
  ["University of Antwerp", "Belgia", "BE", "Antwerp", "https://www.uantwerpen.be"],
  ["University of Basel", "Elveția", "CH", "Basel", "https://www.unibas.ch"],
  ["University of Bern", "Elveția", "CH", "Bern", "https://www.unibe.ch"],
  ["University of Bologna", "Italia", "IT", "Bologna", "https://www.unibo.it"],
  ["University of Freiburg", "Germania", "DE", "Freiburg", "https://uni-freiburg.de"],
  ["Radboud University Nijmegen", "Olanda", "NL", "Nijmegen", "https://www.ru.nl"],
  ["Stockholm University", "Suedia", "SE", "Stockholm", "https://www.su.se"],
  ["University of Barcelona", "Spania", "ES", "Barcelona", "https://web.ub.edu"],
  ["University of Cologne", "Germania", "DE", "Cologne", "https://uni-koeln.de"],
  ["University of Erlangen-Nuremberg", "Germania", "DE", "Erlangen", "https://www.fau.eu"],
  ["University of Hamburg", "Germania", "DE", "Hamburg", "https://www.uni-hamburg.de"],
  ["University of Lausanne", "Elveția", "CH", "Lausanne", "https://www.unil.ch"],
  ["University of Liverpool", "Marea Britanie", "GB", "Liverpool", "https://www.liverpool.ac.uk"],
  ["University of Münster", "Germania", "DE", "Münster", "https://www.uni-muenster.de"],
  ["Newcastle University", "Marea Britanie", "GB", "Newcastle", "https://www.ncl.ac.uk"],
  ["University of Padua", "Italia", "IT", "Padua", "https://www.unipd.it"],
  ["University of Pisa", "Italia", "IT", "Pisa", "https://www.unipi.it"],
  ["Pompeu Fabra University", "Spania", "ES", "Barcelona", "https://www.upf.edu"],
  ["Sapienza University of Rome", "Italia", "IT", "Rome", "https://www.uniroma1.it"],
  ["Uppsala University", "Suedia", "SE", "Uppsala", "https://www.uu.se"],
  ["Autonomous University of Barcelona", "Spania", "ES", "Barcelona", "https://www.uab.cat"],
  ["University of Bergen", "Norvegia", "NO", "Bergen", "https://www.uib.no"],
  ["Cardiff University", "Marea Britanie", "GB", "Cardiff", "https://www.cardiff.ac.uk"],
  ["Durham University", "Marea Britanie", "GB", "Durham", "https://www.durham.ac.uk"],
  ["University of Gothenburg", "Suedia", "SE", "Gothenburg", "https://www.gu.se"],
  ["University of Leicester", "Marea Britanie", "GB", "Leicester", "https://le.ac.uk"],
  ["University of Lisbon", "Portugalia", "PT", "Lisbon", "https://www.ulisboa.pt"],
  ["Loughborough University", "Marea Britanie", "GB", "Loughborough", "https://www.lboro.ac.uk"],
  ["Maastricht University", "Olanda", "NL", "Maastricht", "https://www.maastrichtuniversity.nl"],
  ["University of Milan", "Italia", "IT", "Milan", "https://www.unimi.it"],
  ["University of Oslo", "Norvegia", "NO", "Oslo", "https://www.uio.no"],
  ["University of Oulu", "Finlanda", "FI", "Oulu", "https://www.oulu.fi"],
  ["Politecnico di Milano", "Italia", "IT", "Milan", "https://www.polimi.it", "technical"],
  ["University of Reading", "Marea Britanie", "GB", "Reading", "https://www.reading.ac.uk"],
  ["University of Strathclyde", "Marea Britanie", "GB", "Glasgow", "https://www.strath.ac.uk"],
  ["KTH Royal Institute of Technology", "Suedia", "SE", "Stockholm", "https://www.kth.se", "technical"],
  ["TU Wien", "Austria", "AT", "Vienna", "https://www.tuwien.at", "technical"],
  ["University of Turku", "Finlanda", "FI", "Turku", "https://www.utu.fi"],
  ["University of Würzburg", "Germania", "DE", "Würzburg", "https://www.uni-wuerzburg.de"],
  ["Bielefeld University", "Germania", "DE", "Bielefeld", "https://www.uni-bielefeld.de"],
  ["Chalmers University of Technology", "Suedia", "SE", "Gothenburg", "https://www.chalmers.se", "technical"],
  ["University of Cyprus", "Cipru", "CY", "Nicosia", "https://www.ucy.ac.cy"],
  ["Dublin City University", "Irlanda", "IE", "Dublin", "https://www.dcu.ie"],
  ["University of Eastern Finland", "Finlanda", "FI", "Joensuu", "https://www.uef.fi"],
  ["University of Florence", "Italia", "IT", "Florence", "https://www.unifi.it"],
  ["Freie Universität Berlin", "Germania", "DE", "Berlin", "https://www.fu-berlin.de"],
  ["University of Geneva", "Elveția", "CH", "Geneva", "https://www.unige.ch"],
  ["University of Göttingen", "Germania", "DE", "Göttingen", "https://www.uni-goettingen.de"],
  ["University of Innsbruck", "Austria", "AT", "Innsbruck", "https://www.uibk.ac.at"],
  ["University of Konstanz", "Germania", "DE", "Konstanz", "https://www.uni-konstanz.de"],
  ["University of Liège", "Belgia", "BE", "Liège", "https://www.uliege.be"],
  ["University of Luxembourg", "Luxemburg", "LU", "Luxembourg", "https://www.uni.lu"],
  ["University of Mannheim", "Germania", "DE", "Mannheim", "https://www.uni-mannheim.de", "economics"]
].map(([name, country, countryCode, city, website, type]) => entry({ name, country, countryCode, city, website, type, source: "THE Europe 2026" }));

const romanianUniversities = [
  ["Universitatea din București", "UB", "București", "https://unibuc.ro"],
  ["Universitatea Babeș-Bolyai", "UBB", "Cluj-Napoca", "https://www.ubbcluj.ro"],
  ["Universitatea Alexandru Ioan Cuza din Iași", "UAIC", "Iași", "https://www.uaic.ro"],
  ["Universitatea de Vest din Timișoara", "UVT", "Timișoara", "https://www.uvt.ro"],
  ["Universitatea din Craiova", "UCV", "Craiova", "https://www.ucv.ro"],
  ["Universitatea Ovidius din Constanța", "UOC", "Constanța", "https://www.univ-ovidius.ro"],
  ["Universitatea Dunărea de Jos din Galați", "UDJG", "Galați", "https://www.ugal.ro"],
  ["Universitatea Lucian Blaga din Sibiu", "ULBS", "Sibiu", "https://www.ulbsibiu.ro"],
  ["Universitatea din Oradea", "UO", "Oradea", "https://www.uoradea.ro"],
  ["Universitatea Transilvania din Brașov", "UNITBV", "Brașov", "https://www.unitbv.ro"],
  ["Universitatea Ștefan cel Mare din Suceava", "USV", "Suceava", "https://www.usv.ro"],
  ["Universitatea Valahia din Târgoviște", "UVTg", "Târgoviște", "https://www.valahia.ro"],
  ["Universitatea Petrol-Gaze din Ploiești", "UPG", "Ploiești", "https://www.upg-ploiesti.ro"],
  ["Universitatea 1 Decembrie 1918 din Alba Iulia", "UAB", "Alba Iulia", "https://www.uab.ro"],
  ["Universitatea Aurel Vlaicu din Arad", "UAV", "Arad", "https://www.uav.ro"],
  ["Universitatea Constantin Brâncuși din Târgu Jiu", "UCB", "Târgu Jiu", "https://www.utgjiu.ro"],
  ["Școala Națională de Studii Politice și Administrative", "SNSPA", "București", "https://snspa.ro", "law"],
  ["Academia de Studii Economice din București", "ASE", "București", "https://ase.ro", "economics"],
  ["Universitatea Națională de Știință și Tehnologie Politehnica București", "UNSTPB", "București", "https://upb.ro", "technical"],
  ["Universitatea Tehnică din Cluj-Napoca", "UTCN", "Cluj-Napoca", "https://www.utcluj.ro", "technical"],
  ["Universitatea Tehnică Gheorghe Asachi din Iași", "TUIASI", "Iași", "https://www.tuiasi.ro", "technical"],
  ["Universitatea Politehnica Timișoara", "UPT", "Timișoara", "https://www.upt.ro", "technical"],
  ["Universitatea Tehnică de Construcții București", "UTCB", "București", "https://utcb.ro", "technical"],
  ["Universitatea de Arhitectură și Urbanism Ion Mincu", "UAUIM", "București", "https://www.uauim.ro", "technical"],
  ["Universitatea Maritimă din Constanța", "UMC", "Constanța", "https://cmu-edu.eu", "technical"],
  ["Universitatea de Medicină și Farmacie Carol Davila", "UMFCD", "București", "https://umfcd.ro", "medical"],
  ["Universitatea de Medicină și Farmacie Iuliu Hațieganu", "UMFIH", "Cluj-Napoca", "https://www.umfcluj.ro", "medical"],
  ["Universitatea de Medicină și Farmacie Grigore T. Popa", "UMFIS", "Iași", "https://www.umfiasi.ro", "medical"],
  ["Universitatea de Medicină și Farmacie Victor Babeș", "UMFT", "Timișoara", "https://www.umft.ro", "medical"],
  ["Universitatea de Medicină, Farmacie, Științe și Tehnologie George Emil Palade", "UMFST", "Târgu Mureș", "https://www.umfst.ro", "medical"],
  ["Universitatea de Medicină și Farmacie din Craiova", "UMFCV", "Craiova", "https://www.umfcv.ro", "medical"],
  ["Universitatea de Științe Agronomice și Medicină Veterinară din București", "USAMVB", "București", "https://www.usamv.ro", "agronomy"],
  ["Universitatea de Științe Agricole și Medicină Veterinară Cluj-Napoca", "USAMVCN", "Cluj-Napoca", "https://www.usamvcluj.ro", "agronomy"],
  ["Universitatea pentru Științele Vieții Ion Ionescu de la Brad", "USVIASI", "Iași", "https://www.uaiasi.ro", "agronomy"],
  ["Universitatea de Științele Vieții Regele Mihai I din Timișoara", "USVT", "Timișoara", "https://www.usab-tm.ro", "agronomy"],
  ["Universitatea Națională de Arte București", "UNARTE", "București", "https://www.unarte.org", "arts"],
  ["Universitatea Națională de Muzică din București", "UNMB", "București", "https://www.unmb.ro", "arts"],
  ["Universitatea Națională de Artă Teatrală și Cinematografică I.L. Caragiale", "UNATC", "București", "https://unatc.ro", "arts"],
  ["Universitatea de Artă și Design din Cluj-Napoca", "UAD", "Cluj-Napoca", "https://www.uad.ro", "arts"],
  ["Universitatea Națională de Arte George Enescu din Iași", "UNAGE", "Iași", "https://www.arteiasi.ro", "arts"],
  ["Universitatea de Arte din Târgu Mureș", "UAT", "Târgu Mureș", "https://www.uat.ro", "arts"],
  ["Universitatea Națională de Educație Fizică și Sport", "UNEFS", "București", "https://unefs.ro"],
  ["Universitatea Creștină Dimitrie Cantemir", "UCDC", "București", "https://www.ucdc.ro"],
  ["Universitatea Titu Maiorescu", "UTM", "București", "https://www.utm.ro"],
  ["Universitatea Româno-Americană", "URA", "București", "https://www.rau.ro", "economics"],
  ["Universitatea Nicolae Titulescu", "UNT", "București", "https://www.univnt.ro", "law"],
  ["Universitatea Hyperion", "UH", "București", "https://www.hyperion.ro"],
  ["Universitatea Spiru Haret", "USH", "București", "https://spiruharet.ro"],
  ["Universitatea Ecologică din București", "UEB", "București", "https://www.ueb.ro"],
  ["Universitatea Artifex din București", "ARTIFEX", "București", "https://www.artifex.org.ro", "economics"],
  ["Universitatea Bioterra din București", "BIOTERRA", "București", "https://www.bioterra.ro", "agronomy"],
  ["Universitatea Athenaeum din București", "ATH", "București", "https://www.univath.ro"],
  ["Universitatea Danubius din Galați", "UD", "Galați", "https://www.univ-danubius.ro"],
  ["Universitatea George Bacovia din Bacău", "UGB", "Bacău", "https://www.ugb.ro", "economics"],
  ["Universitatea de Vest Vasile Goldiș din Arad", "UVVG", "Arad", "https://www.uvvg.ro"],
  ["Universitatea Petre Andrei din Iași", "UPA", "Iași", "https://www.upa.ro"],
  ["Universitatea Tibiscus din Timișoara", "TIBISCUS", "Timișoara", "https://www.tibiscus.ro"],
  ["Universitatea Agora din Oradea", "AGORA", "Oradea", "https://univagora.ro"],
  ["Universitatea Emanuel din Oradea", "UEO", "Oradea", "https://emanuel.ro"],
  ["Universitatea Sapientia din Cluj-Napoca", "SAPIENTIA", "Cluj-Napoca", "https://sapientia.ro"]
].map(([name, shortName, city, website, type]) => entry({
  name,
  shortName,
  country: "România",
  countryCode: "RO",
  city,
  website,
  type,
  source: "ARACIS / Ministerul Educației"
}));

const curatedEurope = europeTop2026.slice(0, 60);
const curatedRomania = romanianUniversities.slice(0, 35);

export const universityCatalog = [...curatedEurope, ...curatedRomania]
  .filter((item, index, list) => list.findIndex((candidate) => candidate.name === item.name) === index);
