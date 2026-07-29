import { statusMeta } from "../utils/status.js";
import { t } from "../i18n.js";

export function StatusPill({ status, language = "ro" }) {
  const meta = statusMeta[status] || statusMeta.Wishlist;
  return <span className={`status-pill ${meta.tone}`}>{t(meta.label, language)}</span>;
}
