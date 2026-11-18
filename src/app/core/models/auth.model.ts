/** Cuerpo de POST /auth/registro. Equivale al RegistroRequest de la API. */
export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
}

/** Respuesta de la API al registrarse o iniciar sesión (AuthResponse). */
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  email: string;
  rol: string;
}
