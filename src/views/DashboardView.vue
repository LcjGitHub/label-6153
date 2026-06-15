<script setup lang="ts">
import dayjs from 'dayjs';
import { computed } from 'vue';
import { useCalendarStore } from '@/stores/calendar';
import { usePlantsStore } from '@/stores/plants';
import type { MonthSuggestion, PlantCatalogItem, UserPlant } from '@/types';
import SuggestionBlock from '@/components/SuggestionBlock.vue';

const calendarStore = useCalendarStore();
const plantsStore = usePlantsStore();

const monthLabel = computed(() =>
  calendarStore.currentMonth.format('YYYY 年 M 月'),
);

const isViewingCurrentMonth = computed(() => {
  const now = dayjs();
  return (
    calendarStore.currentMonth.year() === now.year() &&
    calendarStore.currentMonth.month() === now.month()
  );
});

const cityOptions = computed(() =>
  calendarStore.cities.map((city) => ({
    label: `${city.name}（${city.climate}）`,
    value: city.id,
  })),
);

interface PlantCardData {
  userPlant: UserPlant;
  catalogPlant: PlantCatalogItem | null;
  suggestion: MonthSuggestion | null;
}

const plantCards = computed<PlantCardData[]>(() => {
  return plantsStore.items.map((userPlant) => {
    const { plant, suggestion } = calendarStore.getSuggestionForCityPlantNameMonth(
      calendarStore.selectedCityId,
      userPlant.name,
      calendarStore.currentMonthNumber,
    );
    return {
      userPlant,
      catalogPlant: plant,
      suggestion,
    };
  });
});

const hasPlants = computed(() => plantsStore.items.length > 0);
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">植物总览看板</h1>
    <p class="page-desc">
      按当前所选城市与月份，一览您所有植物的播种、浇水与施肥养护建议摘要。
    </p>

    <div class="card-block filter-bar">
      <t-row :gutter="[16, 16]" align="middle">
        <t-col :xs="12" :md="4">
          <t-form label-align="top">
            <t-form-item label="所在城市">
              <t-select
                :value="calendarStore.selectedCityId"
                :options="cityOptions"
                placeholder="请选择城市"
                filterable
                @change="calendarStore.setCity"
              />
            </t-form-item>
          </t-form>
        </t-col>
        <t-col :xs="12" :md="8">
          <div class="month-switcher">
            <t-space>
              <t-button variant="outline" @click="calendarStore.goPrevMonth">
                上月
              </t-button>
              <t-tag theme="default" variant="outline" class="month-display">
                {{ monthLabel }}
              </t-tag>
              <t-button
                :theme="isViewingCurrentMonth ? 'primary' : 'default'"
                variant="outline"
                @click="calendarStore.goToday"
              >
                本月
              </t-button>
              <t-button variant="outline" @click="calendarStore.goNextMonth">
                下月
              </t-button>
            </t-space>
          </div>
        </t-col>
      </t-row>
    </div>

    <template v-if="hasPlants">
      <div class="plant-grid">
        <t-card
          v-for="card in plantCards"
          :key="card.userPlant.id"
          class="plant-card"
          :bordered="true"
        >
          <template #title>
            <div class="plant-title">
              <span class="plant-name">{{ card.userPlant.name }}</span>
              <t-tag
                v-if="card.catalogPlant"
                theme="success"
                variant="light"
                size="small"
              >
                {{ card.catalogPlant.category }}
              </t-tag>
              <t-tag
                v-else
                theme="warning"
                variant="light"
                size="small"
              >
                未匹配
              </t-tag>
            </div>
          </template>
          <template v-if="card.userPlant.variety" #subtitle>
            <span class="plant-variety">品种：{{ card.userPlant.variety }}</span>
          </template>

          <SuggestionBlock
            :suggestion="card.suggestion"
            :city-name="calendarStore.selectedCity?.name"
            :plant-name="card.userPlant.name"
            mode="inline"
          />
        </t-card>
      </div>
    </template>
    <t-empty
      v-else
      description="暂无植物，请先到「我的植物」添加植物后再来查看看板"
    >
      <template #image>
        <div style="font-size: 72px; line-height: 1;">🪴</div>
      </template>
    </t-empty>
  </div>
</template>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
}

.month-switcher {
  display: flex;
  align-items: center;
}

.month-display {
  font-size: 16px;
  font-weight: 600;
  padding: 4px 16px;
  color: #14532d;
}

.plant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.plant-card {
  display: flex;
  flex-direction: column;
}

.plant-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.plant-name {
  font-size: 16px;
  font-weight: 600;
  color: #14532d;
}

.plant-variety {
  font-size: 12px;
  color: #64748b;
}
</style>
