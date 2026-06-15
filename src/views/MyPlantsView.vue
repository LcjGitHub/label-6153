<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import dayjs from 'dayjs';
import { MessagePlugin } from 'tdesign-vue-next';
import { useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { plantFormSchema, type PlantFormValues } from '@/schemas/plantForm';
import { usePlantsStore } from '@/stores/plants';
import type { SortOrder } from '@/stores/plants';
import type { UserPlant } from '@/types';

const plantsStore = usePlantsStore();

const dialogVisible = ref(false);
const editingId = ref<string | null>(null);
const deleteConfirmVisible = ref(false);
const deletingId = ref<string | null>(null);

const searchKeyword = ref('');
const sortOrder = ref<SortOrder>('desc');

const sortOptions = [
  { label: '添加日期 降序', value: 'desc' },
  { label: '添加日期 升序', value: 'asc' },
];

watch(searchKeyword, (val) => {
  plantsStore.setSearchKeyword(val);
});

watch(sortOrder, (val) => {
  plantsStore.setSortOrder(val);
});

const displayData = computed(() => plantsStore.sortedItems);
const hasNoMatches = computed(() => plantsStore.searchKeyword.trim() !== '' && displayData.value.length === 0);

const isEditing = computed(() => editingId.value !== null);

const dialogTitle = computed(() => (isEditing.value ? '编辑植物' : '添加植物'));

const { defineField, handleSubmit, resetForm, setValues, errors } = useForm({
  validationSchema: toTypedSchema(plantFormSchema),
  initialValues: {
    name: '',
    variety: '',
    addedAt: dayjs().format('YYYY-MM-DD'),
  },
});

const [name, nameAttrs] = defineField('name');
const [variety, varietyAttrs] = defineField('variety');
const [addedAt, addedAtAttrs] = defineField('addedAt');

const tableColumns = [
  { colKey: 'name', title: '名称', width: 140 },
  { colKey: 'variety', title: '品种', width: 160 },
  { colKey: 'addedAt', title: '添加日期', width: 140 },
  { colKey: 'operation', title: '操作', width: 160 },
];

/**
 * 打开新增对话框
 */
function openCreateDialog() {
  editingId.value = null;
  resetForm({
    values: {
      name: '',
      variety: '',
      addedAt: dayjs().format('YYYY-MM-DD'),
    },
  });
  dialogVisible.value = true;
}

/**
 * 打开编辑对话框
 */
function openEditDialog(plant: UserPlant) {
  editingId.value = plant.id;
  setValues({
    name: plant.name,
    variety: plant.variety,
    addedAt: plant.addedAt,
  });
  dialogVisible.value = true;
}

/**
 * 提交表单（新增或更新）
 */
const onSubmit = handleSubmit((values: PlantFormValues) => {
  if (editingId.value) {
    plantsStore.updatePlant(editingId.value, values);
    MessagePlugin.success('植物信息已更新');
  } else {
    plantsStore.addPlant(values);
    MessagePlugin.success('植物已添加');
  }

  dialogVisible.value = false;
  editingId.value = null;
});

/**
 * 打开删除确认
 */
function openDeleteConfirm(id: string) {
  deletingId.value = id;
  deleteConfirmVisible.value = true;
}

/**
 * 确认删除
 */
function confirmDelete() {
  if (deletingId.value) {
    plantsStore.removePlant(deletingId.value);
    MessagePlugin.success('植物已删除');
  }
  deleteConfirmVisible.value = false;
  deletingId.value = null;
}

/**
 * 关闭表单对话框
 */
function closeDialog() {
  dialogVisible.value = false;
  editingId.value = null;
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">我的植物</h1>
        <p class="page-desc">管理个人阳台植物清单，支持新增、编辑与删除，数据自动本地持久化。</p>
      </div>
      <t-button theme="primary" @click="openCreateDialog">添加植物</t-button>
    </div>

    <div class="card-block">
      <div class="filter-bar">
        <t-input
          v-model="searchKeyword"
          placeholder="搜索植物名称或品种"
          clearable
          style="width: 280px"
        />
        <t-select
          v-model="sortOrder"
          :options="sortOptions"
          style="width: 180px"
        />
      </div>
      <t-table
        row-key="id"
        :data="displayData"
        :columns="tableColumns"
        :empty="hasNoMatches ? '暂无相关植物' : '暂无植物，点击右上角添加'"
        stripe
        hover
      >
        <template #addedAt="{ row }">
          {{ dayjs(row.addedAt).format('YYYY-MM-DD') }}
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="openEditDialog(row)">编辑</t-link>
            <t-link theme="danger" @click="openDeleteConfirm(row.id)">删除</t-link>
          </t-space>
        </template>
      </t-table>
    </div>

    <t-dialog
      :visible="dialogVisible"
      :header="dialogTitle"
      :on-close="closeDialog"
      :footer="false"
      width="480px"
      destroy-on-close
    >
      <t-form label-align="top" @submit.prevent="onSubmit">
        <t-form-item label="植物名称" :status="errors.name ? 'error' : undefined" :tips="errors.name">
          <t-input v-model="name" v-bind="nameAttrs" placeholder="如：番茄" clearable />
        </t-form-item>

        <t-form-item label="品种" :status="errors.variety ? 'error' : undefined" :tips="errors.variety">
          <t-input v-model="variety" v-bind="varietyAttrs" placeholder="如：樱桃番茄" clearable />
        </t-form-item>

        <t-form-item label="添加日期" :status="errors.addedAt ? 'error' : undefined" :tips="errors.addedAt">
          <t-date-picker
            v-model="addedAt"
            v-bind="addedAtAttrs"
            format="YYYY-MM-DD"
            value-type="YYYY-MM-DD"
            style="width: 100%"
            clearable
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
      <p>确定要删除这条植物记录吗？此操作不可撤销。</p>
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

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
