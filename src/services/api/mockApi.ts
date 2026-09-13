/**
 * Utilidad de simulación de llamados HTTP/API asíncronos a Supabase/PostgreSQL.
 * Simula latencia de red, respuestas HTTP 200 (OK) y errores HTTP 400/403/500.
 */
export async function simularLlamadoApi<T>(
  dataRetorno: T,
  opciones: {
    latenciaMs?: number;
    debeFallar?: boolean;
    mensajeError?: string;
  } = {}
): Promise<T> {
  const { latenciaMs = 600, debeFallar = false, mensajeError = 'Error 500: Fallo de conexión con la base de datos Supabase' } = opciones;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (debeFallar) {
        reject(new Error(mensajeError));
      } else {
        resolve(dataRetorno);
      }
    }, latenciaMs);
  });
}
