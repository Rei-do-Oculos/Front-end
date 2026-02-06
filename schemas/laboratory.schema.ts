import { z } from 'zod';

export const laboratorySchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cnpj: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  email: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'E-mail inválido'
    )
    .transform(val => val || null),
  address: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  contact_name: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  notes: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  active: z
    .boolean()
    .default(true),
});

export type LaboratoryFormData = z.infer<typeof laboratorySchema>;

// Função helper para formatar erros do Zod
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  return errors;
}
