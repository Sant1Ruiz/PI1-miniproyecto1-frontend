export function validateActivityForm({title, description, date, durationMin}) {

  const errors = {}

  if (!title.trim())
    errors.title = "El título es obligatorio"

  if(title && title.length > 100)
    errors.title = "El título no puede superar 100 caracteres"

  if (!description.trim())
    errors.description = "La descripción es obligatoria"

  if (description && description.length > 500)
    errors.description = "La descripción no puede exceder 500 caracteres"

  if (!date)
    errors.date = "La fecha es obligatoria"

  if (!durationMin)
    errors.duration = "La duración es obligatoria"

  if (durationMin && durationMin < 5)
    errors.duration = "La duración mínima es 5 minutos"

  return errors
}