import { universityCatalog } from "../data/catalog.js";

export function listCatalog(req, res) {
  const search = String(req.query.search || "").toLowerCase();
  const results = universityCatalog
    .filter((item) => {
      if (!search) return true;
      return [item.name, item.country, item.city, ...(item.strengths || [])].join(" ").toLowerCase().includes(search);
    })
    .slice(0, 180);
  return res.json({ universities: results });
}
