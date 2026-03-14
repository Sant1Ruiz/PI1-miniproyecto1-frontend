const COLOMBIA_TIME_ZONE = "America/Bogota";

export function getTodayInColombia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}
