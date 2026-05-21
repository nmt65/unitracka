import { Router } from "express";
import { exportCsv, exportJson, exportPdf, exportXml } from "../controllers/exports.controller.js";

export const exportsRouter = Router();

exportsRouter.get("/csv", exportCsv);
exportsRouter.get("/json", exportJson);
exportsRouter.get("/xml", exportXml);
exportsRouter.get("/pdf", exportPdf);
