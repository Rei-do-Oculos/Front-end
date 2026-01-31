import { z } from 'zod';

export const laboratoryLensSchema = z.object({
  laboratory_id: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, 'Laboratório é obrigatório')
    .transform((val) => Number(val)),
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  cost_price: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, 'Preço de custo é obrigatório')
    .transform((val) => {
      const num = Number(String(val).replace(',', '.'));
      return isNaN(num) ? 0 : num;
    })
    .refine((val) => val >= 0, 'Preço de custo deve ser maior ou igual a zero'),
  sale_price: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, 'Preço de venda é obrigatório')
    .transform((val) => {
      const num = Number(String(val).replace(',', '.'));
      return isNaN(num) ? 0 : num;
    })
    .refine((val) => val >= 0, 'Preço de venda deve ser maior ou igual a zero'),
  active: z
    .boolean()
    .default(true),
});

export type LaboratoryLensFormData = z.infer<typeof laboratoryLensSchema>;

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
