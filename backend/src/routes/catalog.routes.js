import { Router } from "express";
import { listCatalog } from "../controllers/catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.get("/", listCatalog);

