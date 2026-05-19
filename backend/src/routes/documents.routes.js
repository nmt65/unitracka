import { Router } from "express";
import { createDocument, deleteDocument, listDocuments, updateDocument } from "../controllers/documents.controller.js";
import { validateBody } from "../middleware/validate.js";
import { documentCreateSchema, documentUpdateSchema } from "../validators/document.validators.js";

export const documentsRouter = Router();

documentsRouter.get("/university/:universityId", listDocuments);
documentsRouter.post("/university/:universityId", validateBody(documentCreateSchema), createDocument);
documentsRouter.patch("/:id", validateBody(documentUpdateSchema), updateDocument);
documentsRouter.delete("/:id", deleteDocument);

