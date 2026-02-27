import { useEffect, useState } from "react";
import { getActivities } from "../api/activities";

export function useActivities() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setStatus("loading");
      setError(null);

      try {
        const list = await getActivities();
        if (!alive) return;
        setData(list ?? []);
        setStatus("success");
      } catch (e) {
        if (!alive) return;
        setData([]);        // 👈 sin DEMO: queda vacío
        setError(e);
        setStatus("error"); // 👈 muestra error real
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { data, status, error };
}