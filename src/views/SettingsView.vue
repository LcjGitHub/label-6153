<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next';
import { usePlantsStore } from '@/stores/plants';
import { useCareRecordsStore } from '@/stores/careRecords';
import { useFavoritesStore } from '@/stores/favorites';
import { useCalendarStore } from '@/stores/calendar';
import {
  createBackupData,
  validateBackupData,
  downloadBackupFile,
  readFileAsText,
  emptyImportStats,
  type BackupData,
  type ImportMode,
  type ImportStats,
} from '@/utils/importExport';

const plantsStore = usePlantsStore();
const careRecordsStore = useCareRecordsStore();
const favoritesStore = useFavoritesStore();
const calendarStore = useCalendarStore();
const router = useRouter();

const isExporting = ref(false);
const isImporting = ref(false);
const importMode = ref<ImportMode>('merge');
const showConfirmDialog = ref(false);
const pendingImportData = ref<BackupData | null>(null);
const lastImportStats = ref<ImportStats | null>(null);
const lastBackupTime = ref<string | null>(null);

const plantsCount = computed(() => plantsStore.items.length);
const careRecordsCount = computed(() => careRecordsStore.items.length);
const favoritesCount = computed(() => favoritesStore.items.length);
const currentCity = computed(() => calendarStore.selectedCity?.name ?? '-');
const currentPlant = computed(() => calendarStore.selectedPlant?.name ?? '-');

async function handleExport() {
  if (isExporting.value) return;
  isExporting.value = true;

  try {
    const backup = createBackupData({
      plants: plantsStore.getAll(),
      preferences: calendarStore.getPreferences(),
    });

    downloadBackupFile(backup);
    lastBackupTime.value = new Date().toLocaleString('zh-CN');
    MessagePlugin.success('数据导出成功，文件已开始下载');
  } catch (err) {
    console.error('Export failed:', err);
    MessagePlugin.error(`导出失败：${err instanceof Error ? err.message : '未知错误'}`);
  } finally {
    isExporting.value = false;
  }
}

async function handleFileSelect(files: File[]) {
  const file = files?.[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.txt')) {
    MessagePlugin.error('请选择 .txt 格式的备份文件');
    return;
  }

  isImporting.value = true;
  lastImportStats.value = null;

  try {
    const text = await readFileAsText(file);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('文件内容不是有效的 JSON');
    }

    const validation = validateBackupData(parsed);
    if (!validation.valid || !validation.data) {
      throw new Error(validation.error ?? '格式校验失败');
    }

    pendingImportData.value = validation.data;
    showConfirmDialog.value = true;
  } catch (err) {
    console.error('Import validation failed:', err);
    MessagePlugin.error(`导入失败：${err instanceof Error ? err.message : '未知错误'}`);
  } finally {
    isImporting.value = false;
  }
}

function doConfirmedImport() {
  if (!pendingImportData.value) return;
  const data = pendingImportData.value;
  const mode = importMode.value;
  const stats = emptyImportStats();

  try {
    const plantsResult = plantsStore.importPlants(data.plants, mode);
    stats.plantsAdded = plantsResult.added;
    stats.plantsUpdated = plantsResult.updated;

    const prefsResult = calendarStore.importPreferences(data.preferences);
    stats.preferencesImported = prefsResult.applied;

    lastImportStats.value = stats;
    pendingImportData.value = null;
    showConfirmDialog.value = false;

    const modeText = mode === 'overwrite' ? '覆盖模式' : '合并模式';
    const prefsHint = prefsResult.applied
      ? ''
      : `（偏好未导入：城市${prefsResult.cityValid ? '' : '不'}有效 / 植物${prefsResult.plantValid ? '' : '不'}有效）`;

    MessagePlugin.success(
      `导入成功（${modeText}）：植物 ${stats.plantsAdded + stats.plantsUpdated} 条${prefsHint}`,
    );
  } catch (err) {
    console.error('Import execution failed:', err);
    MessagePlugin.error(`导入失败：${err instanceof Error ? err.message : '未知错误'}`);
  }
}

function cancelImport() {
  pendingImportData.value = null;
  showConfirmDialog.value = false;
}

function handleClearAllData() {
  const dlg = DialogPlugin.confirm({
    header: '确认清空所有数据？',
    body: '此操作将清空我的植物、养护记录、收藏及月历偏好，且无法撤销。建议先导出备份。',
    confirmBtn: { content: '确认清空', theme: 'danger' },
    cancelBtn: { content: '取消' },
    onConfirm: () => {
      try {
        plantsStore.clearAll();
        careRecordsStore.clearAll();
        favoritesStore.clearAll();
        calendarStore.resetPreferences();
        MessagePlugin.success('已清空所有本地数据');
        dlg.hide();
      } catch (err) {
        console.error('Clear failed:', err);
        MessagePlugin.error(`清空失败：${err instanceof Error ? err.message : '未知错误'}`);
      }
    },
    onClose: () => {
      dlg.hide();
    },
  });
}

function handleUploadChange(fileInfo: { files: File[] }) {
  handleFileSelect(fileInfo.files);
}
</script>

<template>
  <div class="settings-page">
    <div class="page-header">
      <h1 class="page-title">设置</h1>
      <p class="page-desc">管理你的植物数据备份与恢复、偏好设置等</p>
      <t-button variant="text" class="help-link" @click="router.push('/help')">
        <template #icon><t-icon name="help-circle" /></template>
        查看使用帮助
      </t-button>
    </div>

    <section class="card">
      <div class="card-header">
        <h2 class="card-title">📊 数据概览</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">我的植物</div>
          <div class="stat-value">{{ plantsCount }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">养护记录</div>
          <div class="stat-value">{{ careRecordsCount }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">我的收藏</div>
          <div class="stat-value">{{ favoritesCount }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">当前城市 / 植物</div>
          <div class="stat-value small">{{ currentCity }} · {{ currentPlant }}</div>
        </div>
      </div>
      <div v-if="lastBackupTime" class="last-backup">
        上次导出时间：{{ lastBackupTime }}
      </div>
    </section>

    <section class="card">
      <div class="card-header">
        <h2 class="card-title">📦 数据备份</h2>
      </div>
      <div class="card-body">
        <p class="hint">
          将我的植物清单与月历页城市植物选择偏好导出为本地 TXT 文本文件，可用于跨设备迁移或数据备份。
        </p>
        <div class="action-row">
          <t-button
            theme="primary"
            :loading="isExporting"
            @click="handleExport"
          >
            <template #icon>
              <t-icon name="download" />
            </template>
            导出备份文件
          </t-button>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-header">
        <h2 class="card-title">📥 数据恢复</h2>
      </div>
      <div class="card-body">
        <p class="hint">
          从之前导出的 TXT 备份文件中恢复植物数据与月历偏好。导入前会校验文件格式。
        </p>

        <div class="mode-selector">
          <div class="mode-label">导入模式（仅作用于植物与月历偏好）：</div>
          <t-radio-group v-model="importMode" variant="default-filled">
            <t-radio-button value="merge">
              合并（保留现有数据，相同 ID 则更新）
            </t-radio-button>
            <t-radio-button value="overwrite">
              覆盖（清空现有植物与偏好后再导入）
            </t-radio-button>
          </t-radio-group>
        </div>

        <div class="action-row">
          <t-upload
            :theme="'file'"
            :accept="'.txt'"
            :multiple="false"
            :auto-upload="false"
            :show-file-list="false"
            :tips="'仅接受 .txt 格式的备份文件'"
            @add="handleUploadChange"
          >
            <t-button theme="success" :loading="isImporting">
              <template #icon>
                <t-icon name="upload" />
              </template>
              选择备份文件导入
            </t-button>
          </t-upload>
        </div>

        <div v-if="lastImportStats" class="import-result">
          <div class="result-title">最近一次导入结果：</div>
          <ul class="result-list">
            <li>🌱 植物：新增 {{ lastImportStats.plantsAdded }}，更新 {{ lastImportStats.plantsUpdated }}</li>
            <li>📅 月历偏好：{{ lastImportStats.preferencesImported ? '已恢复' : '未恢复' }}</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="card danger-card">
      <div class="card-header">
        <h2 class="card-title">⚠️ 危险操作</h2>
      </div>
      <div class="card-body">
        <p class="hint danger-hint">
          清空所有本地数据前，请确保已导出备份。此操作不可撤销。
        </p>
        <div class="action-row">
          <t-button theme="danger" variant="outline" @click="handleClearAllData">
            <template #icon>
              <t-icon name="delete" />
            </template>
            清空所有数据
          </t-button>
        </div>
      </div>
    </section>

    <t-dialog
      v-model:visible="showConfirmDialog"
      header="确认导入数据？"
      :confirm-btn="{
        content: importMode === 'overwrite' ? '确认覆盖导入' : '确认合并导入',
        theme: importMode === 'overwrite' ? 'danger' : 'primary',
      }"
      :cancel-btn="{ content: '取消' }"
      width="520px"
      @confirm="doConfirmedImport"
      @close="cancelImport"
      @cancel="cancelImport"
    >
      <div v-if="pendingImportData" class="confirm-content">
        <p v-if="importMode === 'overwrite'" class="danger-text">
          ⚠️ 覆盖模式将<strong>清空现有植物与月历偏好</strong>，用备份文件中的内容完全替换（养护记录与收藏不受影响）。
        </p>
        <p v-else>
          合并模式将保留现有植物与月历偏好，备份中相同 ID 的条目会更新现有内容（养护记录与收藏不受影响）。
        </p>
        <div class="confirm-stats">
          <div class="confirm-stat">
            <span class="confirm-stat-label">备份文件导出时间：</span>
            <span class="confirm-stat-value">
              {{ new Date(pendingImportData.exportedAt).toLocaleString('zh-CN') }}
            </span>
          </div>
          <div class="confirm-stat">
            <span class="confirm-stat-label">🌱 植物条目：</span>
            <span class="confirm-stat-value">{{ pendingImportData.plants.length }} 条</span>
          </div>
          <div class="confirm-stat">
            <span class="confirm-stat-label">📅 月历偏好：</span>
            <span class="confirm-stat-value">
              城市 ID {{ pendingImportData.preferences.selectedCityId }} /
              植物 ID {{ pendingImportData.preferences.selectedPlantId }}
            </span>
          </div>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 28px 20px 60px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 600;
  color: #14532d;
}

.page-desc {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.help-link {
  margin-top: 8px;
  padding: 0;
  color: #16a34a;
  font-size: 14px;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.card-header {
  margin-bottom: 16px;
}

.card-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #14532d;
}

.stat-value.small {
  font-size: 14px;
  line-height: 1.4;
}

.last-backup {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;
  font-size: 13px;
  color: #64748b;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hint {
  margin: 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
}

.danger-hint {
  color: #991b1b;
}

.action-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
}

.mode-label {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.import-result {
  margin-top: 8px;
  padding: 14px 16px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #065f46;
  margin-bottom: 8px;
}

.result-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #065f46;
  line-height: 1.9;
}

.danger-card {
  border-color: #fecaca;
}

.confirm-content {
  font-size: 14px;
  line-height: 1.7;
}

.danger-text {
  color: #991b1b;
  margin: 0 0 12px;
  padding: 10px 12px;
  background: #fef2f2;
  border-radius: 8px;
}

.confirm-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.confirm-stat {
  display: flex;
  gap: 8px;
}

.confirm-stat-label {
  color: #64748b;
  min-width: 130px;
}

.confirm-stat-value {
  color: #0f172a;
  font-weight: 500;
  word-break: break-all;
}
</style>
