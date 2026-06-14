<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, ref } from 'vue';
import { useCalendarStore } from '@/stores/calendar';

const calendarStore = useCalendarStore();

const currentMonth = ref(dayjs());

const monthLabel = computed(() => currentMonth.value.format('YYYY 年 M 月'));

const currentMonthNumber = computed(() => currentMonth.value.month() + 1);

const suggestion = computed(() =>
  calendarStore.getSuggestionForMonth(currentMonthNumber.value),
);

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

/**
 * 切换到上一个月
 */
function goPrevMonth() {
  currentMonth.value = currentMonth.value.subtract(1, 'month');
}

/**
 * 切换到下一个月
 */
function goNextMonth() {
  currentMonth.value = currentMonth.value.add(1, 'month');
}

/**
 * 回到当月
 */
function goToday() {
  currentMonth.value = dayjs();
}

/**
 * 日历面板切换月份
 */
function handlePanelChange(payload: { year: number; month: number }) {
  currentMonth.value = dayjs()
    .year(payload.year)
    .month(payload.month - 1)
    .date(1);
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">种植月历建议</h1>
    <p class="page-desc">
      选择所在城市与植物，查看当月播种、浇水与施肥 Mock 建议（数据来自本地 Mock）。
    </p>

    <t-row :gutter="[16, 16]">
      <t-col :xs="12" :md="5">
        <div class="card-block filter-card">
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
            <t-form-item label="植物种类">
              <t-select
                :value="calendarStore.selectedPlantId"
                :options="plantOptions"
                placeholder="请选择植物"
                filterable
                @change="calendarStore.setPlant"
              />
            </t-form-item>
          </t-form>

          <t-divider />

          <div class="selection-summary">
            <t-tag theme="success" variant="light">
              {{ calendarStore.selectedCity?.name ?? '—' }}
            </t-tag>
            <t-tag theme="primary" variant="light">
              {{ calendarStore.selectedPlant?.name ?? '—' }}
            </t-tag>
            <t-tag theme="default" variant="outline">{{ monthLabel }}</t-tag>
          </div>
        </div>
      </t-col>

      <t-col :xs="12" :md="7">
        <div class="card-block calendar-card">
          <div class="calendar-toolbar">
            <t-space>
              <t-button variant="outline" @click="goPrevMonth">上月</t-button>
              <t-button theme="primary" variant="outline" @click="goToday">本月</t-button>
              <t-button variant="outline" @click="goNextMonth">下月</t-button>
            </t-space>
            <span class="calendar-month">{{ monthLabel }}</span>
          </div>

          <t-calendar
            :year="currentMonth.year()"
            :month="currentMonthNumber"
            :fill-with-zero="true"
            @month-change="handlePanelChange"
          />

          <t-divider />

          <div v-if="suggestion" class="suggestion-panel">
            <h3 class="suggestion-title">{{ monthLabel }} 养护建议</h3>
            <t-row :gutter="[12, 12]">
              <t-col :span="12">
                <t-card :bordered="true" size="small" title="🌱 播种建议">
                  <p>{{ suggestion.sow }}</p>
                </t-card>
              </t-col>
              <t-col :span="12">
                <t-card :bordered="true" size="small" title="💧 浇水建议">
                  <p>{{ suggestion.water }}</p>
                </t-card>
              </t-col>
              <t-col :span="12">
                <t-card :bordered="true" size="small" title="🧪 施肥建议">
                  <p>{{ suggestion.fertilize }}</p>
                </t-card>
              </t-col>
            </t-row>
          </div>
          <t-empty v-else description="暂无该组合下的当月建议" />
        </div>
      </t-col>
    </t-row>
  </div>
</template>

<style scoped>
.filter-card {
  height: 100%;
}

.selection-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.calendar-card {
  min-height: 100%;
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.calendar-month {
  font-size: 16px;
  font-weight: 600;
  color: #14532d;
}

.suggestion-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.suggestion-panel p {
  margin: 0;
  line-height: 1.6;
  color: #475569;
  font-size: 14px;
}

:deep(.t-calendar) {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
