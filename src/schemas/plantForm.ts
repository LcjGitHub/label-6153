import { z } from 'zod';

const MAX_TAG_COUNT = 3;
const MAX_TAG_LENGTH = 6;

/**
 * 植物表单 Zod 校验 Schema
 */
export const plantFormSchema = z.object({
  name: z
    .string({ required_error: '请输入植物名称' })
    .trim()
    .min(1, '植物名称不能为空')
    .max(30, '植物名称不超过 30 个字符'),
  variety: z
    .string({ required_error: '请输入品种' })
    .trim()
    .min(1, '品种不能为空')
    .max(30, '品种不超过 30 个字符'),
  addedAt: z
    .string({ required_error: '请选择添加日期' })
    .min(1, '请选择添加日期')
    .refine((value) => !Number.isNaN(Date.parse(value)), '添加日期格式无效'),
  remark: z
    .string()
    .trim()
    .max(100, '备注不超过一百字')
    .optional()
    .or(z.literal('')),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, '标签内容不能为空')
        .max(MAX_TAG_LENGTH, `单个标签不超过 ${MAX_TAG_LENGTH} 个字`),
    )
    .max(MAX_TAG_COUNT, `最多添加 ${MAX_TAG_COUNT} 个标签`)
    .optional()
    .default([]),
});

export type PlantFormValues = z.infer<typeof plantFormSchema>;
