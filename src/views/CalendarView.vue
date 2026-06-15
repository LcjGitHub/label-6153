<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import dayjs from 'dayjs';
import { useRoute, useRouter } from 'vue-router';
import { useCalendarStore } from '@/stores/calendar';
import { useFavoritesStore } from '@/stores/favorites';
import SuggestionBlock from '@/components/SuggestionBlock.vue';

const calendarStore = useCalendarStore();
const favoritesStore = useFavoritesStore();
const route = useRoute();
const router = useRouter();

const plantMatchFailed = ref(false);
const failedPlantName = ref('');

onMounted(() => {
  calendarStore.ensureConsistencyAfterHydrate();
  handlePlantNameFromRoute();
});

function handlePlantNameFromRoute() {
  const plantName = route.query.plantName;
  if (typeof plantName === 'string' && plantName.trim()) {
    const matched = calendarStore.setPlantByName(plantName);
    if (!matched) {
      failedPlantName.value = plantName;
      plantMatchFailed.value = true;
    }
    router.replace({
      name: route.name as string,
      query: {},
      params: route.params,
    });
  }
}

const monthLabel = computed(() =>
  calendarStore.currentMonth.format('YYYY 年 M 月'),
);

const dateLabel = computed(() => {
  if (calendarStore.selectedDate) {
    return calendarStore.selectedDate.format('YYYY 年 M 月 D 日');
  }
  return monthLabel.value;
});

const suggestion = computed(() =>
  calendarStore.getSuggestionForMonth(calendarStore.currentMonthNumber),
);

const cityOptions = computed(() =>
  calendarStore.cities.map((city) => ({
    label: `${city.name}（${city.climate}）`,
    value: city.id,
  })),
);

const categoryOptions = computed(() => {
  const options = calendarStore.categories.map((cat) => ({
    label: cat,
    value: cat,
  }));
  return [{ label: '全部分类', value: '' }, ...options];
});

const plantOptions = computed(() =>
  calendarStore.plants.map((plant) => ({
    label: `${plant.name} · ${plant.category}`,
    value: plant.id,
  })),
);

const isCurrentFavorite = computed(() =>
  favoritesStore.isFavorite(
    calendarStore.selectedCityId,
    calendarStore.selectedPlantId,
  ),
);

/**
 * 日历面板切换月份
 */
function handlePanelChange(payload: { year: number; month: number }) {
  calendarStore.setPanelMonth(payload);
}

/**
 * 点击日历单元格
 */
function handleCellClick(payload: {
  date: Date;
  year: number;
  month: number;
  day: number;
  dateStr: string;
}) {
  const dateISO = dayjs(payload.date).toISOString();
  calendarStore.setSelectedDate(dateISO);
}

const selectedDateStr = computed(() =>
  calendarStore.selectedDate ? calendarStore.selectedDate.format('YYYY-MM-DD') : '',
);

/**
 * 添加当前组合到收藏
 */
function handleAddFavorite() {
  const city = calendarStore.selectedCity;
  const plant = calendarStore.selectedPlant;
  if (!city || !plant) {
    MessagePlugin.warning('请先选择城市和植物');
    return;
  }

  const result = favoritesStore.addFavorite({
    cityId: city.id,
    cityName: city.name,
    plantId: plant.id,
    plantName: plant.name,
  });

  if (result) {
    MessagePlugin.success('已加入收藏');
  } else {
    MessagePlugin.info('该组合已在收藏中');
  }
}
</script>

<template>
  <div class="page-container">
    <t-alert
      v-if="plantMatchFailed"
      theme="warning"
      :message="`未找到名为「${failedPlantName}」的植物，请在下方手动选择`"
      closable
      @close="plantMatchFailed = false"
      style="margin-bottom: 16px"
    />

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
            <t-form-item label="植物分类">
              <t-select
                :value="calendarStore.selectedCategory"
                :options="categoryOptions"
                placeholder="请选择分类"
                @change="calendarStore.setCategory"
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

          <t-button
            :theme="isCurrentFavorite ? 'default' : 'warning'"
            variant="outline"
            :disabled="isCurrentFavorite"
            block
            @click="handleAddFavorite"
          >
            {{ isCurrentFavorite ? '★ 已收藏' : '☆ 加入收藏' }}
          </t-button>

          <t-divider />

          <div class="selection-summary">
            <t-tag theme="success" variant="light">
              {{ calendarStore.selectedCity?.name ?? '—' }}
            </t-tag>
            <t-tag theme="primary" variant="light">
              {{ calendarStore.selectedPlant?.name ?? '—' }}
            </t-tag>
            <t-tag theme="default" variant="outline">{{ dateLabel }}</t-tag>
          </div>
        </div>
      </t-col>

      <t-col :xs="12" :md="7">
        <div class="card-block calendar-card">
          <div class="calendar-toolbar">
            <t-space>
              <t-button variant="outline" @click="calendarStore.goPrevMonth">上月</t-button>
              <t-button theme="primary" variant="outline" @click="calendarStore.goToday">本月</t-button>
              <t-button variant="outline" @click="calendarStore.goNextMonth">下月</t-button>
            </t-space>
            <span class="calendar-month">{{ monthLabel }}</span>
          </div>

          <t-calendar
            :year="calendarStore.currentMonth.year()"
            :month="calendarStore.currentMonthNumber"
            :value="selectedDateStr"
            :fill-with-zero="true"
            @month-change="handlePanelChange"
            @cell-click="handleCellClick"
          />

          <t-divider />

          <div class="suggestion-panel">
            <h3 class="suggestion-title">{{ dateLabel }} 养护建议</h3>
            <SuggestionBlock
              :suggestion="suggestion"
              :city-name="calendarStore.selectedCity?.name"
              :plant-name="calendarStore.selectedPlant?.name"
              mode="card"
              card-layout="grid"
            />
          </div>
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

:deep(.t-calendar) {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
