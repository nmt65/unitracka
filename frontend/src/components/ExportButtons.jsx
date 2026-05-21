import { Download, FileJson, FileText } from "lucide-react";
import { api } from "../services/api.js";

export function ExportButtons({ onToast }) {
  async function handle(type) {
    try {
      await api.downloadExport(type);
      onToast?.("Export generat.");
    } catch (error) {
      onToast?.(error.message);
    }
  }

  return (
    <div className="export-row">
      <button className="soft-button" type="button" onClick={() => handle("csv")}><FileText size={17} /> CSV</button>
      <button className="soft-button" type="button" onClick={() => handle("json")}><FileJson size={17} /> JSON</button>
      <button className="soft-button" type="button" onClick={() => handle("xml")}><FileText size={17} /> XML</button>
      <button className="soft-button" type="button" onClick={() => handle("pdf")}><Download size={17} /> PDF</button>
    </div>
  );
}
