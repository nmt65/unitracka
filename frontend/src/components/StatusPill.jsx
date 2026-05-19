import { statusMeta } from "../utils/status.js";

export function StatusPill({ status }) {
  const meta = statusMeta[status] || statusMeta.Wishlist;
  return <span className={`status-pill ${meta.tone}`}>{meta.label}</span>;
}

