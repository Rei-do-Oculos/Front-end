import { z } from 'zod';

// Schema para validação de Ordem de Serviço
export const serviceOrderSchema = z.object({
  // Campos obrigatórios
  client_id: z
    .string({ required_error: 'Cliente é obrigatório' })
    .min(1, 'Cliente é obrigatório'),
  store_id: z
    .string({ required_error: 'Ótica é obrigatória' })
    .min(1, 'Ótica é obrigatória'),
  user_id: z
    .string({ required_error: 'Usuário é obrigatório' })
    .min(1, 'Usuário é obrigatório'),
  price: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || '0'),

  // Laboratório (opcional)
  laboratory_id: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),

  // Longe - Olho Direito (opcionais)
  far_od_spherical: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  far_od_cylindrical: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  far_od_axis: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),

  // Longe - Olho Esquerdo (opcionais)
  far_oe_spherical: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  far_oe_cylindrical: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  far_oe_axis: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),

  // Perto - Olho Direito (opcionais)
  near_od_spherical: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  near_od_cylindrical: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  near_od_axis: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),

  // Perto - Olho Esquerdo (opcionais)
  near_oe_spherical: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  near_oe_cylindrical: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  near_oe_axis: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),

  // Adição e DNP (opcionais)
  addition: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  far_dnp: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  near_dnp: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),

  // Armação (opcionais)
  frame_code: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  rim_use: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),
  warranty: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),

  // Tipos de lente (opcionais)
  single_vision: z.boolean().default(false),
  bifocal: z.boolean().default(false),
  multifocal: z.boolean().default(false),
  anti_reflective: z.boolean().default(false),
  transitions: z.boolean().default(false),
  frame_included: z.boolean().default(false),
  tinting: z.boolean().default(false),

  // Observações (opcional)
  notes: z
    .string()
    .optional()
    .nullable()
    .transform(val => val || null),

  // Verificado (opcional)
  verified: z.boolean().default(false),

  // Many-to-many (opcionais)
  laboratory_lenses: z.array(z.string()).default([]),
  frames: z.array(z.string()).default([]),
  lenses: z.array(z.string()).default([]),

  // Toggle de laboratório (não vai para o backend)
  send_to_lab: z.boolean().default(false),
}).superRefine((data, ctx) => {
  const isWarranty = !!data.warranty;
  if (!isWarranty) {
    const num = parseFloat(String(data.price || '0').replace(',', '.').replace(/[^\d.]/g, ''));
    if (isNaN(num) || num <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Preço é obrigatório e deve ser maior que zero',
      });
    }
  }
});

export type ServiceOrderFormData = z.infer<typeof serviceOrderSchema>;

// Função helper para formatar erros do Zod (Zod 4 usa .issues, não .errors)
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  const issues = (error?.issues ?? []) as Array<{ path: (string | number)[]; message: string }>;
  for (const err of issues) {
    const path = (err.path ?? []).join('.');
    if (path && !errors[path]) {
      errors[path] = err.message;
    }
  }
  return errors;
}
