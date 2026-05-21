import PDFDocument from "pdfkit";
import { Document, University } from "../models/index.js";
import { documentProgress, documentsRemaining } from "../utils/progress.js";
import { tag } from "../utils/xml.js";

async function getUserUniversities(userId) {
  return University.findAll({
    where: { UserId: userId },
    include: [Document],
    order: [["deadline", "ASC"]]
  });
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function exportJson(req, res, next) {
  try {
    const universities = await getUserUniversities(req.user.id);
    res.setHeader("Content-Disposition", "attachment; filename=unitracka-universitati.json");
    return res.json({ exportedAt: new Date().toISOString(), universities });
  } catch (error) {
    next(error);
  }
}

export async function exportCsv(req, res, next) {
  try {
    const universities = await getUserUniversities(req.user.id);
    const rows = [
      ["Universitate", "Tara", "Facultate", "Program", "Tip", "Status", "Deadline", "Taxa anuala", "Rating", "Progres documente", "Documente ramase"],
      ...universities.map((uni) => [
        uni.name,
        uni.country,
        uni.faculty,
        uni.program,
        uni.programType,
        uni.status,
        uni.deadline,
        uni.annualTuition ?? "",
        uni.rating ?? "",
        `${documentProgress(uni.Documents)}%`,
        documentsRemaining(uni.Documents)
      ])
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=unitracka-universitati.csv");
    return res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportXml(req, res, next) {
  try {
    const universities = await getUserUniversities(req.user.id);
    const body = universities.map((uni) => [
      "<universitate>",
      tag("nume", uni.name),
      tag("tara", uni.country),
      tag("facultate", uni.faculty),
      tag("program", uni.program),
      tag("tip", uni.programType),
      tag("status", uni.status),
      tag("deadline", uni.deadline),
      tag("progresDocumente", `${documentProgress(uni.Documents)}%`),
      tag("documenteRamase", documentsRemaining(uni.Documents)),
      "</universitate>"
    ].join("")).join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?><unitrack exportedAt="${new Date().toISOString()}">${body}</unitrack>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=unitrack-export.xml");
    return res.send(xml);
  } catch (error) {
    next(error);
  }
}

export async function exportPdf(req, res, next) {
  try {
    const universities = await getUserUniversities(req.user.id);
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=unitracka-status.pdf");
    doc.pipe(res);

    doc.fontSize(22).fillColor("#7668FF").text("UniTrack - status aplicații");
    doc.moveDown(0.5).fontSize(10).fillColor("#555").text(`Generat pentru ${req.user.name} la ${new Date().toLocaleString("ro-RO")}`);
    doc.moveDown();

    universities.forEach((uni, index) => {
      if (index > 0) doc.moveDown(0.8);
      doc.fontSize(14).fillColor("#111").text(`${uni.name} - ${uni.program}`);
      doc.fontSize(10).fillColor("#444").text(`${uni.faculty}, ${uni.country} | ${uni.programType} | Deadline: ${uni.deadline}`);
      doc.text(`Status: ${uni.status} | Progres documente: ${documentProgress(uni.Documents)}% | Documente obligatorii ramase: ${documentsRemaining(uni.Documents)}`);
      if (uni.notes) doc.fillColor("#666").text(`Note: ${uni.notes.slice(0, 220)}`);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
}
