import { defineStore } from 'pinia';
import dayjs from 'dayjs';
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
    const currentMonthISO = ref(dayjs().toISOString());

    const cities = computed(() => data.cities);
    const plants = computed(() => data.plants);

    const selectedCity = computed(
      () => cities.value.find((c) => c.id === selectedCityId.value) ?? null,
    );

    const selectedPlant = computed(
      () => plants.value.find((p) => p.id === selectedPlantId.value) ?? null,
    );

    const currentMonth = computed(() => dayjs(currentMonthISO.value));

    const currentMonthNumber = computed(() => currentMonth.value.month() + 1);

    /**
     * 获取指定城市在列表中的下一个城市
     * @param cityId - 当前城市 ID
     */
    function getNextCityId(cityId: string): string {
      const idx = cities.value.findIndex((c) => c.id === cityId);
      if (idx === -1) return cities.value[0]?.id ?? '';
      const nextIdx = (idx + 1) % cities.value.length;
      return cities.value[nextIdx]?.id ?? '';
    }

    /**
     * 获取指定月份的种植建议
     * @param month - 月份 1–12
     */
    function getSuggestionForMonth(month: number): MonthSuggestion | null {
      return getSuggestionForCityPlantMonth(
        selectedCityId.value,
        selectedPlantId.value,
        month,
      );
    }

    /**
     * 根据城市、植物和月份获取种植建议
     * @param cityId - 城市 ID
     * @param plantId - 植物 ID
     * @param month - 月份 1–12
     */
    function getSuggestionForCityPlantMonth(
      cityId: string,
      plantId: string,
      month: number,
    ): MonthSuggestion | null {
      const citySuggestions = data.suggestions[cityId];
      if (!citySuggestions) return null;

      const plantSuggestions = citySuggestions[plantId];
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

    /**
     * 切换到上一个月
     */
    function goPrevMonth() {
      currentMonthISO.value = dayjs(currentMonthISO.value)
        .subtract(1, 'month')
        .toISOString();
    }

    /**
     * 切换到下一个月
     */
    function goNextMonth() {
      currentMonthISO.value = dayjs(currentMonthISO.value)
        .add(1, 'month')
        .toISOString();
    }

    /**
     * 回到当月
     */
    function goToday() {
      currentMonthISO.value = dayjs().toISOString();
    }

    /**
     * 日历面板切换月份
     */
    function setPanelMonth(payload: { year: number; month: number }) {
      currentMonthISO.value = dayjs()
        .year(payload.year)
        .month(payload.month - 1)
        .date(1)
        .toISOString();
    }

    return {
      selectedCityId,
      selectedPlantId,
      currentMonthISO,
      cities,
      plants,
      selectedCity,
      selectedPlant,
      currentMonth,
      currentMonthNumber,
      getNextCityId,
      getSuggestionForMonth,
      getSuggestionForCityPlantMonth,
      setCity,
      setPlant,
      goPrevMonth,
      goNextMonth,
      goToday,
      setPanelMonth,
    };
  },
  {
    persist: {
      key: 'balcony-calendar-selection',
      pick: [
        'selectedCityId',
        'selectedPlantId',
        'currentMonthISO',
      ],
    },
  },
);
