import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getActivities } from "../api/activities";
import { getTodayInColombia } from "../utils/dateUtils";

const ActivityStatsCtx = createContext(null);

export function ActivityStatsProvider({ children }) {
  const { token } = useAuth();
  const [resumen, setResumen] = useState({ total: 0, completadas: 0, pendientes: 0, vencidas: 0 });

  const refresh = useCallback(() => {
    if (!token) return;
    const today = getTodayInColombia();
    getActivities()
      .then(activities => {
        const main = activities.filter(a => a.parent === null);
        setResumen({
          total:       main.length,
          completadas: main.filter(a => a.status_id === 3).length,
          pendientes:  main.filter(a => a.status_id === 1 || a.status_id === 2).length,
          vencidas:    main.filter(a => a.due_date && a.due_date.split("T")[0] < today && a.status_id !== 3).length,
        });
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ActivityStatsCtx.Provider value={{ resumen, refresh }}>
      {children}
    </ActivityStatsCtx.Provider>
  );
}

export function useActivityStats() {
  return useContext(ActivityStatsCtx);
}
