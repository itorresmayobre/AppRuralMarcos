import { z } from 'zod';

export const solicitudRegistroSchema = z.object({
  nombreContacto: z
    .string()
    .min(3, { message: 'El nombre y apellido debe tener al menos 3 caracteres.' })
    .max(100, { message: 'El nombre es demasiado largo.' })
    .refine((val) => val.trim().length > 0, { message: 'El nombre no puede estar vacío.' }),

  email: z
    .string()
    .min(1, { message: 'El correo electrónico es obligatorio.' })
    .email({ message: 'Ingresa un correo electrónico válido (ej: usuario@empresa.com).' })
    .transform((val) => val.trim().toLowerCase()),

  telefono: z
    .string()
    .optional()
    .refine((val) => !val || val.replace(/\D/g, '').length >= 7, {
      message: 'El teléfono debe tener al menos 7 dígitos numéricos.',
    }),
});

export type SolicitudRegistroInput = z.infer<typeof solicitudRegistroSchema>;
