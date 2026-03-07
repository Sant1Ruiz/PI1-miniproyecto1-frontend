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

  return errors
}

export function validateRegister({ name, email, password, confirmPassword }) {

  const errors = {}

  if (!name.trim()) {
    errors.name = "El nombre es obligatorio"
  }

  if (!email.trim()) {
    errors.email = "El email es obligatorio"
  }

  const emailRegex = /\S+@\S+\.\S+/

  if (email && !emailRegex.test(email)) {
    errors.email = "El email no es válido"
  }

  if (!password) {
    errors.password = "La contraseña es obligatoria"
  }

  if (password && password.length < 6) {
    errors.password = "La contraseña debe tener mínimo 6 caracteres"
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden"
  }

  return errors
}