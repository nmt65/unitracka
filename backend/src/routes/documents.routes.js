import { Router } from "express";
import {
  createApplicationDocument,
  createDocument,
  deleteDocument,
  listApplicationDocuments,
  listDocuments,
  updateDocument
} from "../controllers/documents.controller.js";
import { validateBody } from "../middleware/validate.js";
import { documentCreateSchema, documentUpdateSchema } from "../validators/document.validators.js";

export const documentsRouter = Router();

documentsRouter.get("/university/:universityId", listDocuments);
documentsRouter.post("/university/:universityId", validateBody(documentCreateSchema), createDocument);
documentsRouter.get("/application/:applicationId", listApplicationDocuments);
documentsRouter.post("/application/:applicationId", validateBody(documentCreateSchema), createApplicationDocument);
documentsRouter.patch("/:id", validateBody(documentUpdateSchema), updateDocument);
documentsRouter.delete("/:id", deleteDocument);
