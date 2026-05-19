export function notFound(_req, res) {
  res.status(404).json({ message: "Ruta nu exista." });
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);
  const status = error.status || 500;
  const message = status === 500 ? "A aparut o eroare pe server." : error.message;
  res.status(status).json({ message });
}

