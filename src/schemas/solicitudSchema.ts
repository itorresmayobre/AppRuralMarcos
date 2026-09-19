import { z } from 'zod';
import { validarCIUruguaya, validarTelefonoUruguayo } from '../utils/validacionesUruguay';

export const solicitudRegistroSchema = z.object({
  nombre: z
    .string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
    .max(50, { message: 'El nombre es demasiado largo.' })
    .refine((val) => val.trim().length > 0, { message: 'El nombre no puede estar vacío.' }),

  apellido: z
    .string()
    .min(2, { message: 'El apellido debe tener al menos 2 caracteres.' })
    .max(50, { message: 'El apellido es demasiado largo.' })
    .refine((val) => val.trim().length > 0, { message: 'El apellido no puede estar vacío.' }),

  ci: z
    .string()
    .min(1, { message: 'La Cédula de Identidad (C.I.) es obligatoria.' })
    .refine((val) => validarCIUruguaya(val), {
      message: 'La C.I. ingresada no es válida (verifica los dígitos y el dígito verificador).',
    }),

  email: z
    .string()
    .min(1, { message: 'El correo electrónico es obligatorio.' })
    .email({ message: 'Ingresa un correo electrónico válido (ej: usuario@empresa.com).' })
    .transform((val) => val.trim().toLowerCase()),

  telefono: z
    .string()
    .min(1, { message: 'El teléfono de contacto es obligatorio.' })
    .refine((val) => validarTelefonoUruguayo(val), {
      message: 'Ingresa un teléfono uruguayo válido (Celular ej: 099 123 456 / Fijo ej: 4532 1234).',
    }),
});

export type SolicitudRegistroInput = z.infer<typeof solicitudRegistroSchema>;
