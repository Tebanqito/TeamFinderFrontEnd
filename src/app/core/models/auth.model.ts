/** Cuerpo de POST /auth/registro. Equivale al RegistroRequest de la API. */
export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
}

/** Cuerpo de POST /auth/login. Equivale al LoginRequest de la API. */
export interface LoginRequest {
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

/** Datos de la sesión iniciada que se guardan en el navegador. */
export interface Sesion {
  token: string;
  email: string;
  rol: string;
}
