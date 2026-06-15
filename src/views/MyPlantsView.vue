<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import dayjs from 'dayjs';
import { MessagePlugin } from 'tdesign-vue-next';
import { useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import { plantFormSchema, type PlantFormValues } from '@/schemas/plantForm';
import { usePlantsStore } from '@/stores/plants';
import type { UserPlant } from '@/types';

type SortOrder = 'asc' | 'desc';

const MAX_TAG_COUNT = 3;
const MAX_TAG_LENGTH = 6;

const plantsStore = usePlantsStore();
const router = useRouter();

const dialogVisible = ref(false);
const editingId = ref<string | null>(null);
const deleteConfirmVisible = ref(false);
const deletingId = ref<string | null>(null);

const searchKeyword = ref('');
const sortOrder = ref<SortOrder>('desc');
const selectedTagFilter = ref<string>('');

const tagInputValue = ref('');
const tagErrorTip = ref('');

const sortOptions = [
  { label: '添加日期 降序', value: 'desc' },
  { label: '添加日期 升序', value: 'asc' },
];

const allTags = computed(() => {
  const tagSet = new Set<string>();
  for (const plant of plantsStore.items) {
    if (plant.tags) {
      for (const tag of plant.tags) {
        if (tag.trim()) tagSet.add(tag.trim());
      }
    }
  }
  return Array.from(tagSet);
});

const tagFilterOptions = computed(() => [
  { label: '全部标签', value: '' },
  ...allTags.value.map((t) => ({ label: t, value: t })),
]);

const displayData = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  const tagFilter = selectedTagFilter.value.trim();
  let list = plantsStore.items;

  if (keyword) {
    list = list.filter((plant) => plant.name.toLowerCase().includes(keyword));
  }

  if (tagFilter) {
    list = list.filter(
      (plant) => plant.tags && plant.tags.includes(tagFilter),
    );
  }

  return [...list].sort((a, b) => {
    const dateA = new Date(a.addedAt).getTime();
    const dateB = new Date(b.addedAt).getTime();
    return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA;
  });
});

const hasNoMatches = computed(
  () =>
    (searchKeyword.value.trim() !== '' || selectedTagFilter.value !== '') &&
    displayData.value.length === 0,
);

const isEditing = computed(() => editingId.value !== null);

const dialogTitle = computed(() => (isEditing.value ? '编辑植物' : '添加植物'));

const { defineField, handleSubmit, resetForm, setValues, errors, setFieldValue } =
  useForm({
    validationSchema: toTypedSchema(plantFormSchema),
    initialValues: {
      name: '',
      variety: '',
      addedAt: dayjs().format('YYYY-MM-DD'),
      remark: '',
      tags: [],
    },
  });

const [name, nameAttrs] = defineField('name');
const [variety, varietyAttrs] = defineField('variety');
const [addedAt, addedAtAttrs] = defineField('addedAt');
const [remark, remarkAttrs] = defineField('remark');
const [tags] = defineField('tags');

const tableColumns = [
  { colKey: 'name', title: '名称', width: 140 },
  { colKey: 'variety', title: '品种', width: 160 },
  { colKey: 'tags', title: '标签', width: 240 },
  { colKey: 'addedAt', title: '添加日期', width: 140 },
  { colKey: 'remark', title: '备注', ellipsis: true },
  { colKey: 'operation', title: '操作', width: 220 },
];

function resetTagState() {
  tagInputValue.value = '';
  tagErrorTip.value = '';
}

function addTag() {
  const currentTags = tags.value ?? [];
  const value = tagInputValue.value.trim();

  if (!value) {
    tagErrorTip.value = '标签内容不能为空';
    return;
  }
  if (value.length > MAX_TAG_LENGTH) {
    tagErrorTip.value = `单个标签不超过 ${MAX_TAG_LENGTH} 个字`;
    return;
  }
  if (currentTags.length >= MAX_TAG_COUNT) {
    tagErrorTip.value = `最多添加 ${MAX_TAG_COUNT} 个标签`;
    return;
  }
  if (currentTags.includes(value)) {
    tagErrorTip.value = '该标签已存在';
    return;
  }

  setFieldValue('tags', [...currentTags, value]);
  tagInputValue.value = '';
  tagErrorTip.value = '';
}

function removeTag(index: number) {
  const currentTags = tags.value ?? [];
  const newTags = currentTags.filter((_, i) => i !== index);
  setFieldValue('tags', newTags);
}

function handleTagInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTag();
  }
}

/**
 * 打开新增对话框
 */
function openCreateDialog() {
  editingId.value = null;
  resetTagState();
  resetForm({
    values: {
      name: '',
      variety: '',
      addedAt: dayjs().format('YYYY-MM-DD'),
      remark: '',
      tags: [],
    },
  });
  dialogVisible.value = true;
}

/**
 * 打开编辑对话框
 */
function openEditDialog(plant: UserPlant) {
  editingId.value = plant.id;
  resetTagState();
  setValues({
    name: plant.name,
    variety: plant.variety,
    addedAt: plant.addedAt,
    remark: plant.remark || '',
    tags: plant.tags || [],
  });
  dialogVisible.value = true;
}

/**
 * 提交表单（新增或更新）
 */
const onSubmit = handleSubmit((values: PlantFormValues) => {
  const payload = {
    ...values,
    tags: (values.tags ?? []).length > 0 ? values.tags : undefined,
  };

  if (editingId.value) {
    plantsStore.updatePlant(editingId.value, payload);
    MessagePlugin.success('植物信息已更新');
  } else {
    plantsStore.addPlant(payload);
    MessagePlugin.success('植物已添加');
  }

  dialogVisible.value = false;
  editingId.value = null;
  resetTagState();
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
 * 跳转到月历页并尝试自动选中同名植物
 */
function goToCalendar(plantName: string) {
  router.push({
    name: 'calendar',
    query: { plantName },
  });
}

/**
 * 关闭表单对话框
 */
function closeDialog() {
  dialogVisible.value = false;
  editingId.value = null;
  resetTagState();
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">我的植物</h1>
        <p class="page-desc">
          管理个人阳台植物清单，支持新增、编辑与删除，数据自动本地持久化。
        </p>
      </div>
      <t-button theme="primary" @click="openCreateDialog">添加植物</t-button>
    </div>

    <div class="card-block">
      <div class="filter-bar">
        <t-input
          v-model="searchKeyword"
          placeholder="搜索植物名称"
          clearable
          style="width: 240px"
        />
        <t-select
          v-model="selectedTagFilter"
          :options="tagFilterOptions"
          placeholder="按标签筛选"
          clearable
          style="width: 180px"
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
        <template #tags="{ row }">
          <div v-if="row.tags && row.tags.length > 0" class="tag-cell">
            <t-tag
              v-for="(tag, idx) in row.tags"
              :key="idx"
              theme="primary"
              variant="light"
              size="small"
              class="plant-tag"
            >
              {{ tag }}
            </t-tag>
          </div>
          <span v-else class="empty-tags">-</span>
        </template>
        <template #addedAt="{ row }">
          {{ dayjs(row.addedAt).format('YYYY-MM-DD') }}
        </template>
        <template #operation="{ row }">
          <t-space>
            <t-link theme="primary" @click="goToCalendar(row.name)">查看月历</t-link>
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

        <t-form-item
          label="自定义标签"
          :status="(errors.tags || tagErrorTip) ? 'error' : undefined"
          :tips="errors.tags || tagErrorTip"
          help="最多 3 个标签，每个标签不超过 6 个字，按回车添加"
        >
          <div class="tags-input-wrapper">
            <div v-if="tags && tags.length > 0" class="tags-preview">
              <t-tag
                v-for="(tag, idx) in tags"
                :key="idx"
                theme="primary"
                variant="light"
                closable
                @close="removeTag(idx)"
                class="plant-tag"
              >
                {{ tag }}
              </t-tag>
            </div>
            <t-input
              v-if="!tags || tags.length < MAX_TAG_COUNT"
              v-model="tagInputValue"
              placeholder="输入标签后按回车添加"
              :maxlength="MAX_TAG_LENGTH"
              class="tag-input"
              @keydown="handleTagInputKeydown"
              @blur="addTag"
            />
          </div>
        </t-form-item>

        <t-form-item label="备注" :status="errors.remark ? 'error' : undefined" :tips="errors.remark">
          <t-textarea
            v-model="remark"
            placeholder="请输入备注（最多一百字）"
            :maxlength="100"
            :autosize="{ minRows: 3, maxRows: 5 }"
            @blur="remarkAttrs.onBlur"
            @change="remarkAttrs.onChange"
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

.tag-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.plant-tag {
  margin: 0;
}

.empty-tags {
  color: #b1b5b8;
}

.tags-input-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 40px;
  transition: border-color 0.2s;
}

.tags-input-wrapper:focus-within {
  border-color: #0052d9;
  box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.1);
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-input {
  flex: 1;
  min-width: 160px;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.tag-input :deep(.t-input__wrap),
.tag-input :deep(input) {
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  background: transparent !important;
}
</style>
