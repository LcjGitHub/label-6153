import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import calendarData from '@/mock/planting-calendar.json';
import type { MonthSuggestion, PlantingCalendarData } from '@/types';

const data = calendarData as PlantingCalendarData;

/**
 * 月历筛选与建议查询 Store（持久化用户选择）
 */
export const useCalendarStore = defineStore(
  'calendar',
  () => {
    const selectedCityId = ref(data.cities[0]?.id ?? '');
    const selectedPlantId = ref(data.plants[0]?.id ?? '');

    const cities = computed(() => data.cities);
    const plants = computed(() => data.plants);

    const selectedCity = computed(
      () => cities.value.find((c) => c.id === selectedCityId.value) ?? null,
    );

    const selectedPlant = computed(
      () => plants.value.find((p) => p.id === selectedPlantId.value) ?? null,
    );

    /**
     * 获取指定月份的种植建议
     * @param month - 月份 1–12
     */
    function getSuggestionForMonth(month: number): MonthSuggestion | null {
      const citySuggestions = data.suggestions[selectedCityId.value];
      if (!citySuggestions) return null;

      const plantSuggestions = citySuggestions[selectedPlantId.value];
      if (!plantSuggestions) return null;

      return plantSuggestions[String(month)] ?? null;
    }

    /**
     * 设置选中的城市
     */
    function setCity(cityId: string) {
      selectedCityId.value = cityId;
    }

    /**
     * 设置选中的植物
     */
    function setPlant(plantId: string) {
      selectedPlantId.value = plantId;
    }

    return {
      selectedCityId,
      selectedPlantId,
      cities,
      plants,
      selectedCity,
      selectedPlant,
      getSuggestionForMonth,
      setCity,
      setPlant,
    };
  },
  {
    persist: {
      key: 'balcony-calendar-selection',
      pick: ['selectedCityId', 'selectedPlantId'],
    },
  },
);
