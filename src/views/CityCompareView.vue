<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCalendarStore } from '@/stores/calendar';

const calendarStore = useCalendarStore();

const monthLabel = computed(() =>
  calendarStore.currentMonth.format('YYYY 年 M 月'),
);

const city1Id = ref(calendarStore.selectedCityId);
const city2Id = ref(calendarStore.getNextCityId(calendarStore.selectedCityId));
const plantId = ref(calendarStore.selectedPlantId);

const cityOptions = computed(() =>
  calendarStore.cities.map((city) => ({
    label: `${city.name}（${city.climate}）`,
    value: city.id,
  })),
);

const plantOptions = computed(() =>
  calendarStore.plants.map((plant) => ({
    label: `${plant.name} · ${plant.category}`,
    value: plant.id,
  })),
);

const city1 = computed(() =>
  calendarStore.cities.find((c) => c.id === city1Id.value) ?? null,
);

const city2 = computed(() =>
  calendarStore.cities.find((c) => c.id === city2Id.value) ?? null,
);

const city1Suggestion = computed(() =>
  calendarStore.getSuggestionForCityPlantMonth(
    city1Id.value,
    plantId.value,
    calendarStore.currentMonthNumber,
  ),
);

const city2Suggestion = computed(() =>
  calendarStore.getSuggestionForCityPlantMonth(
    city2Id.value,
    plantId.value,
    calendarStore.currentMonthNumber,
  ),
);

/**
 * 交换两个对比城市
 */
function swapCities() {
  const temp = city1Id.value;
  city1Id.value = city2Id.value;
  city2Id.value = temp;
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">双城对比</h1>
    <p class="page-desc">
      选择两座城市与一种植物，对比查看同一月份下的播种、浇水与施肥建议差异。
    </p>

    <div class="card-block filter-card">
      <t-form label-align="top">
        <t-row :gutter="[16, 0]">
          <t-col :xs="12" :md="4">
            <t-form-item label="城市 A">
              <t-select
                :value="city1Id"
                :options="cityOptions"
                placeholder="请选择城市"
                filterable
                @change="(val: string) => (city1Id = val)"
              />
            </t-form-item>
          </t-col>
          <t-col :xs="12" :md="4">
            <t-form-item label="城市 B">
              <t-select
                :value="city2Id"
                :options="cityOptions"
                placeholder="请选择城市"
                filterable
                @change="(val: string) => (city2Id = val)"
              />
            </t-form-item>
          </t-col>
          <t-col :xs="12" :md="4">
            <t-form-item label="植物种类">
              <t-select
                :value="plantId"
                :options="plantOptions"
                placeholder="请选择植物"
                filterable
                @change="(val: string) => (plantId = val)"
              />
            </t-form-item>
          </t-col>
          <t-col :xs="12" :md="4">
            <t-form-item label="操作">
              <t-space>
                <t-button variant="outline" @click="swapCities">↔ 交换城市</t-button>
              </t-space>
            </t-form-item>
          </t-col>
        </t-row>
      </t-form>

      <t-divider />

      <div class="compare-toolbar">
        <t-space>
          <t-button variant="outline" @click="calendarStore.goPrevMonth">上月</t-button>
          <t-button theme="primary" variant="outline" @click="calendarStore.goToday">本月</t-button>
          <t-button variant="outline" @click="calendarStore.goNextMonth">下月</t-button>
        </t-space>
        <span class="compare-month">{{ monthLabel }}</span>
      </div>
    </div>

    <t-row :gutter="[16, 16]" class="compare-row">
      <t-col :xs="12" :md="6">
        <div class="card-block city-card">
          <div class="city-header">
            <h3 class="city-name">{{ city1?.name ?? '城市 A' }}</h3>
            <t-tag v-if="city1" theme="success" variant="light">
              {{ city1.climate }}
            </t-tag>
          </div>

          <template v-if="city1Suggestion">
            <t-card :bordered="true" size="small" title="🌱 播种建议" class="suggestion-card">
              <p>{{ city1Suggestion.sow }}</p>
            </t-card>
            <t-card :bordered="true" size="small" title="💧 浇水建议" class="suggestion-card">
              <p>{{ city1Suggestion.water }}</p>
            </t-card>
            <t-card :bordered="true" size="small" title="🧪 施肥建议" class="suggestion-card">
              <p>{{ city1Suggestion.fertilize }}</p>
            </t-card>
          </template>
          <t-empty v-else description="该城市暂无此植物的当月建议" />
        </div>
      </t-col>

      <t-col :xs="12" :md="6">
        <div class="card-block city-card">
          <div class="city-header">
            <h3 class="city-name">{{ city2?.name ?? '城市 B' }}</h3>
            <t-tag v-if="city2" theme="primary" variant="light">
              {{ city2.climate }}
            </t-tag>
          </div>

          <template v-if="city2Suggestion">
            <t-card :bordered="true" size="small" title="🌱 播种建议" class="suggestion-card">
              <p>{{ city2Suggestion.sow }}</p>
            </t-card>
            <t-card :bordered="true" size="small" title="💧 浇水建议" class="suggestion-card">
              <p>{{ city2Suggestion.water }}</p>
            </t-card>
            <t-card :bordered="true" size="small" title="🧪 施肥建议" class="suggestion-card">
              <p>{{ city2Suggestion.fertilize }}</p>
            </t-card>
          </template>
          <t-empty v-else description="该城市暂无此植物的当月建议" />
        </div>
      </t-col>
    </t-row>
  </div>
</template>

<style scoped>
.filter-card {
  margin-bottom: 16px;
}

.compare-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.compare-month {
  font-size: 16px;
  font-weight: 600;
  color: #14532d;
}

.compare-row {
  margin-top: 16px;
}

.city-card {
  min-height: 100%;
}

.city-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.city-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #14532d;
}

.suggestion-card {
  margin-bottom: 12px;
}

.suggestion-card:last-child {
  margin-bottom: 0;
}

.suggestion-card p {
  margin: 0;
  line-height: 1.6;
  color: #475569;
  font-size: 14px;
}
</style>
