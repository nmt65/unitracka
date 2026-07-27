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

    doc.rect(0, 0, doc.page.width, 98).fill("#0f4f59");
    doc.fillColor("#ffffff").fontSize(22).text("UniTrack - dosar de admitere", 48, 34);
    doc.fontSize(10).fillColor("#d8fffb").text(`Generat pentru ${req.user.name} la ${new Date().toLocaleString("ro-RO")}`, 48, 64);
    doc.y = 126;
    doc.moveDown();

    universities.forEach((uni, index) => {
      if (index > 0) doc.moveDown(0.8);
      const progress = documentProgress(uni.Documents);
      const remaining = documentsRemaining(uni.Documents);
      const cardY = doc.y;
      doc.roundedRect(48, cardY, 498, 92, 8).fillAndStroke("#f4f8f8", "#cfe0df");
      doc.fillColor("#102024").fontSize(13).text(`${uni.name} - ${uni.program}`, 64, cardY + 14, { width: 450 });
      doc.fontSize(9).fillColor("#506a6f").text(`${uni.faculty}, ${uni.country} | ${uni.programType} | Deadline: ${uni.deadline}`, 64, cardY + 34, { width: 450 });
      doc.fillColor("#0f8f84").fontSize(10).text(`Status: ${uni.status} | Progres documente: ${progress}% | Documente obligatorii ramase: ${remaining}`, 64, cardY + 54, { width: 450 });
      if (uni.notes) doc.fillColor("#506a6f").fontSize(8).text(`Note: ${uni.notes.slice(0, 180)}`, 64, cardY + 70, { width: 450 });
      doc.y = cardY + 104;
      if (doc.y > 720) doc.addPage();
    });

    doc.end();
  } catch (error) {
    next(error);
  }
}
