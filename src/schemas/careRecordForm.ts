import { z } from 'zod';

export const careRecordFormSchema = z.object({
  plantId: z
    .string({ required_error: '请选择植物' })
    .min(1, '请选择植物'),
  date: z
    .string({ required_error: '请选择记录日期' })
    .min(1, '请选择记录日期')
    .refine((value) => !Number.isNaN(Date.parse(value)), '日期格式无效'),
  type: z
    .enum(['water', 'fertilize', 'repot'], {
      required_error: '请选择养护类型',
      invalid_type_error: '养护类型无效',
    }),
  remark: z
    .string()
    .trim()
    .max(50, '备注不超过 50 个字符'),
});

export type CareRecordFormValues = z.infer<typeof careRecordFormSchema>;
