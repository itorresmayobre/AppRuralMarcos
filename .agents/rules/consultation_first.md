# Regla de Consulta Previa y Análisis Técnico

1. **Análisis Primero**: Cuando el usuario realiza una pregunta exploratoria, pide opiniones sobre diseño/arquitectura o sugiere posibles soluciones (ej: "¿no sería prudente...?", "¿cómo vería esto...?", "¿qué opinas...?"), el asistente DEBE responder únicamente con el análisis conceptual, pros, contras y propuesta visual/técnica.
2. **Esperar Confirmación**: El asistente NUNCA debe modificar código ni crear archivos en caliente ante preguntas conceptuales. Debe esperar la confirmación explícita del usuario antes de proceder a la edición.
3. **No Hardcodear Datos de Referencia**: Si los datos ya residen en la Base de Datos (PostgreSQL / Supabase), el frontend debe consultarlos dinámicamente desde la BD sin duplicar arrays duros en el código cliente.
