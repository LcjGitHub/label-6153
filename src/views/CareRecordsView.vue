<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import dayjs from 'dayjs';
import { MessagePlugin } from 'tdesign-vue-next';
import { useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import { careRecordFormSchema, type CareRecordFormValues } from '@/schemas/careRecordForm';
import { useCareRecordsStore } from '@/stores/careRecords';
import { usePlantsStore } from '@/stores/plants';
import type { CareType } from '@/types';

const plantsStore = usePlantsStore();
const careRecordsStore = useCareRecordsStore();

const dialogVisible = ref(false);
const deleteConfirmVisible = ref(false);
const deletingId = ref<string | null>(null);

const plantOptions = computed(() =>
  plantsStore.items.map((plant) => ({
    label: `${plant.name}（${plant.variety}）`,
    value: plant.id,
  })),
);

const careTypeOptions = [
  { label: '浇水', value: 'water' as CareType },
  { label: '施肥', value: 'fertilize' as CareType },
  { label: '换盆', value: 'repot' as CareType },
];

const careTypeLabelMap: Record<CareType, string> = {
  water: '浇水',
  fertilize: '施肥',
  repot: '换盆',
};

const { defineField, handleSubmit, resetForm, errors } = useForm({
  validationSchema: toTypedSchema(careRecordFormSchema),
  initialValues: {
    plantId: '',
    date: dayjs().format('YYYY-MM-DD'),
    type: 'water' as CareType,
    remark: '',
  },
});

const [plantId, plantIdAttrs] = defineField('plantId');
const [date, dateAttrs] = defineField('date');
const [type, typeAttrs] = defineField('type');
const [remark, remarkAttrs] = defineField('remark');

const tableColumns = [
  { colKey: 'plantName', title: '植物名称', width: 160 },
  { colKey: 'date', title: '记录日期', width: 140 },
  { colKey: 'type', title: '养护类型', width: 120 },
  { colKey: 'remark', title: '备注', ellipsis: true },
  { colKey: 'operation', title: '操作', width: 120 },
];

function openCreateDialog() {
  resetForm({
    values: {
      plantId: '',
      date: dayjs().format('YYYY-MM-DD'),
      type: 'water' as CareType,
      remark: '',
    },
  });
  dialogVisible.value = true;
}

const onSubmit = handleSubmit((values: CareRecordFormValues) => {
  const plant = plantsStore.findById(values.plantId);
  if (!plant) {
    MessagePlugin.error('植物不存在');
    return;
  }

  careRecordsStore.addRecord({
    plantId: values.plantId,
    plantName: plant.name,
    date: values.date,
    type: values.type,
    remark: values.remark,
  });

  MessagePlugin.success('养护记录已添加');
  dialogVisible.value = false;
});

function openDeleteConfirm(id: string) {
  deletingId.value = id;
  deleteConfirmVisible.value = true;
}

function confirmDelete() {
  if (deletingId.value) {
    careRecordsStore.removeRecord(deletingId.value);
    MessagePlugin.success('记录已删除');
  }
  deleteConfirmVisible.value = false;
  deletingId.value = null;
}

function closeDialog() {
  dialogVisible.value = false;
}

function formatCareType(type: CareType) {
  return careTypeLabelMap[type] ?? type;
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">养护记录</h1>
        <p class="page-desc">记录每一次植物养护，按时间倒序展示，支持添加与删除，数据自动本地持久化。</p>
      </div>
      <t-button theme="primary" @click="openCreateDialog">添加记录</t-button>
    </div>

    <div class="card-block">
      <t-table
        row-key="id"
        :data="careRecordsStore.sortedItems"
        :columns="tableColumns"
        :empty="'暂无养护记录，点击右上角添加'"
        stripe
        hover
      >
        <template #date="{ row }">
          {{ dayjs(row.date).format('YYYY-MM-DD') }}
        </template>
        <template #type="{ row }">
          {{ formatCareType(row.type) }}
        </template>
        <template #operation="{ row }">
          <t-link theme="danger" @click="openDeleteConfirm(row.id)">删除</t-link>
        </template>
      </t-table>
    </div>

    <t-dialog
      :visible="dialogVisible"
      header="添加养护记录"
      :on-close="closeDialog"
      :footer="false"
      width="480px"
      destroy-on-close
    >
      <t-form label-align="top" @submit.prevent="onSubmit">
        <t-form-item label="选择植物" :status="errors.plantId ? 'error' : undefined" :tips="errors.plantId">
          <t-select
            v-model="plantId"
            v-bind="plantIdAttrs"
            :options="plantOptions"
            placeholder="请选择植物"
            clearable
          />
        </t-form-item>

        <t-form-item label="记录日期" :status="errors.date ? 'error' : undefined" :tips="errors.date">
          <t-date-picker
            v-model="date"
            v-bind="dateAttrs"
            format="YYYY-MM-DD"
            value-type="YYYY-MM-DD"
            style="width: 100%"
            clearable
          />
        </t-form-item>

        <t-form-item label="养护类型" :status="errors.type ? 'error' : undefined" :tips="errors.type">
          <t-radio-group v-model="type" v-bind="typeAttrs">
            <t-radio-button v-for="option in careTypeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </t-radio-button>
          </t-radio-group>
        </t-form-item>

        <t-form-item label="备注" :status="errors.remark ? 'error' : undefined" :tips="errors.remark">
          <t-textarea
            v-model="remark"
            v-bind="remarkAttrs"
            placeholder="请输入备注（不超过 50 字）"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </t-form-item>

        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">保存</t-button>
            <t-button variant="outline" @click="closeDialog">取消</t-button>
          </t-space>
        </t-form-item>
      </t-form>
    </t-dialog>

    <t-dialog
      v-model:visible="deleteConfirmVisible"
      header="确认删除"
      :on-confirm="confirmDelete"
    >
      <p>确定要删除这条养护记录吗？此操作不可撤销。</p>
    </t-dialog>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>
