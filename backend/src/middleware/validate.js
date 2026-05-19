import { ZodError } from "zod";

export function validateBody(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery(schema) {
  return (req, _res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function handleValidationError(error, _req, res, next) {
  if (!(error instanceof ZodError)) return next(error);
  return res.status(422).json({
    message: "Date invalide.",
    details: error.errors.map((item) => ({ path: item.path.join("."), message: item.message }))
  });
}

