import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.js";

export function useUniversities(enabled) {
  const [universities, setUniversities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([api.listUniversities(), api.stats()]);
      setUniversities(list.universities);
      setStats(summary.stats);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { universities, stats, loading, refresh };
}

