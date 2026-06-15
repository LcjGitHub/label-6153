<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCalendarStore } from '@/stores/calendar';
import SuggestionBlock from '@/components/SuggestionBlock.vue';
import type { PlantCatalogItem } from '@/types';

const calendarStore = useCalendarStore();

const selectedCityId = ref(calendarStore.selectedCityId);
const selectedCategory = ref('');
const expandedPlantId = ref<string | null>(null);

const cityOptions = computed(() =>
  calendarStore.cities.map((city) => ({
    label: `${city.name}（${city.climate}）`,
    value: city.id,
  })),
);

const categoryOptions = computed(() => {
  const categories = calendarStore.getAllCategories();
  return [
    { label: '全部分类', value: '' },
    ...categories.map((cat) => ({ label: cat, value: cat })),
  ];
});

const filteredPlants = computed(() =>
  calendarStore.getPlantsByCategory(selectedCategory.value),
);

const selectedCity = computed(() =>
  calendarStore.cities.find((c) => c.id === selectedCityId.value) ?? null,
);

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const monthLabels = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

function toggleExpand(plantId: string) {
  if (expandedPlantId.value === plantId) {
    expandedPlantId.value = null;
  } else {
    expandedPlantId.value = plantId;
  }
}

function handleCityChange(val: string) {
  selectedCityId.value = val;
  calendarStore.setCity(val);
}

function getMonthSummary(plant: PlantCatalogItem, month: number) {
  const suggestion = calendarStore.getSuggestionForCityPlantMonth(
    selectedCityId.value,
    plant.id,
    month,
  );
  if (!suggestion) return { sow: '—', water: '—', fertilize: '—' };
  return {
    sow: suggestion.sow.length > 12 ? suggestion.sow.slice(0, 12) + '…' : suggestion.sow,
    water: suggestion.water.length > 12 ? suggestion.water.slice(0, 12) + '…' : suggestion.water,
    fertilize: suggestion.fertilize.length > 12 ? suggestion.fertilize.slice(0, 12) + '…' : suggestion.fertilize,
  };
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">植物百科</h1>
    <p class="page-desc">
      浏览全部植物目录，切换城市查看每种植物全年十二个月的播种、浇水与施肥养护建议。
    </p>

    <div class="card-block filter-card">
      <t-form label-align="top">
        <t-row :gutter="[16, 0]">
          <t-col :xs="12" :md="6">
            <t-form-item label="选择城市">
              <t-select
                :value="selectedCityId"
                :options="cityOptions"
                placeholder="请选择城市"
                filterable
                @change="handleCityChange"
              />
            </t-form-item>
          </t-col>
          <t-col :xs="12" :md="6">
            <t-form-item label="植物分类">
              <t-select
                :value="selectedCategory"
                :options="categoryOptions"
                placeholder="请选择分类"
                @change="(val: string) => (selectedCategory = val)"
              />
            </t-form-item>
          </t-col>
        </t-row>
      </t-form>
      <div v-if="selectedCity" class="city-info">
        <t-tag theme="success" variant="light">
          当前城市：{{ selectedCity.name }} · {{ selectedCity.climate }}气候
        </t-tag>
        <span class="plant-count">共 {{ filteredPlants.length }} 种植物</span>
      </div>
    </div>

    <div class="plant-list">
      <div
        v-for="plant in filteredPlants"
        :key="plant.id"
        class="card-block plant-card"
        :class="{ expanded: expandedPlantId === plant.id }"
      >
        <div class="plant-header" @click="toggleExpand(plant.id)">
          <div class="plant-basic">
            <span class="plant-icon">🌿</span>
            <div class="plant-info">
              <h3 class="plant-name">{{ plant.name }}</h3>
              <t-tag theme="primary" variant="light" size="small">
                {{ plant.category }}
              </t-tag>
            </div>
          </div>
          <t-icon
            :name="expandedPlantId === plant.id ? 'chevron-up' : 'chevron-down'"
            size="20px"
            class="expand-icon"
          />
        </div>

        <div class="summary-section">
          <div class="summary-title">全年建议概要</div>
          <div class="summary-table-wrapper">
            <table class="summary-table">
              <thead>
                <tr>
                  <th class="col-month">月份</th>
                  <th class="col-sow">🌱 播种</th>
                  <th class="col-water">💧 浇水</th>
                  <th class="col-fertilize">🧪 施肥</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(month, idx) in months" :key="month">
                  <td class="col-month">{{ monthLabels[idx] }}</td>
                  <td class="col-sow">{{ getMonthSummary(plant, month).sow }}</td>
                  <td class="col-water">{{ getMonthSummary(plant, month).water }}</td>
                  <td class="col-fertilize">{{ getMonthSummary(plant, month).fertilize }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="expandedPlantId === plant.id" class="detail-section">
          <t-divider />
          <div class="detail-title">逐月详细建议</div>
          <t-tabs v-model="expandedPlantId" class="yearly-tabs">
            <t-tab-panel
              v-for="(month, idx) in months"
              :key="plant.id + '-' + month"
              :value="String(month)"
              :label="monthLabels[idx]"
            >
              <SuggestionBlock
                :suggestion="calendarStore.getSuggestionForCityPlantMonth(selectedCityId, plant.id, month)"
                :city-name="selectedCity?.name"
                :plant-name="plant.name"
                mode="card"
                card-layout="grid"
              />
            </t-tab-panel>
          </t-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}

.city-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.plant-count {
  font-size: 13px;
  color: #64748b;
}

.plant-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plant-card {
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.plant-card:hover {
  box-shadow: 0 4px 12px rgb(15 23 42 / 8%);
}

.plant-card.expanded {
  cursor: default;
}

.plant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.plant-basic {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plant-icon {
  font-size: 28px;
}

.plant-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plant-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #14532d;
}

.expand-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.summary-section {
  margin-top: 16px;
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 10px;
}

.summary-table-wrapper {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 520px;
}

.summary-table th,
.summary-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.summary-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.summary-table tbody tr:last-child td {
  border-bottom: none;
}

.summary-table tbody tr:hover {
  background: #f8fafc;
}

.col-month {
  width: 60px;
  white-space: nowrap;
  color: #14532d;
  font-weight: 600;
}

.col-sow,
.col-water,
.col-fertilize {
  color: #475569;
}

.detail-section {
  margin-top: 4px;
}

.detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
}

.yearly-tabs {
  margin-top: 8px;
}

@media (max-width: 640px) {
  .plant-name {
    font-size: 16px;
  }

  .summary-table {
    font-size: 12px;
  }

  .summary-table th,
  .summary-table td {
    padding: 6px 8px;
  }
}
</style>
