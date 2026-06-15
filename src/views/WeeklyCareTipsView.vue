<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePlantsStore } from '@/stores/plants';
import { useCalendarStore } from '@/stores/calendar';
import { generateWeeklyTips } from '@/utils/weeklyCareTips';
import type { WeeklyCareTip } from '@/types';

const plantsStore = usePlantsStore();
const calendarStore = useCalendarStore();
const router = useRouter();

const weeklyTips = computed(() => {
  return generateWeeklyTips({
    userPlants: plantsStore.items,
    selectedCityId: calendarStore.selectedCityId,
    currentMonth: calendarStore.currentMonthNumber,
    findPlantByName: calendarStore.findPlantByName,
    getSuggestionForCityPlantMonth: calendarStore.getSuggestionForCityPlantMonth,
  });
});

const hasAnyPlants = computed(() => plantsStore.items.length > 0);

const hasMatchedTips = computed(() => weeklyTips.value.matchedTips.length > 0);

const hasUnmatchedTips = computed(() => weeklyTips.value.unmatchedTips.length > 0);

const currentCityName = computed(() => calendarStore.selectedCity?.name ?? '未知城市');

const currentMonthText = computed(() => `${calendarStore.currentMonthNumber}月`);

function getAttentionTags(tip: WeeklyCareTip) {
  const tags: { label: string; theme: string }[] = [];
  if (tip.needWaterAttention) {
    tags.push({ label: '重点浇水', theme: 'danger' });
  }
  if (tip.needFertilizeAttention) {
    tags.push({ label: '重点施肥', theme: 'warning' });
  }
  return tags;
}

function goToCalendar(plantName: string) {
  router.push({
    name: 'calendar',
    query: { plantName },
  });
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">本周养护提示</h1>
        <p class="page-desc">
          根据您的植物清单与「{{ currentCityName }}」{{ currentMonthText }}月历建议，自动生成本周养护关注事项。
        </p>
      </div>
    </div>

    <div v-if="!hasAnyPlants" class="card-block">
      <t-empty description="暂无植物，请先添加您的植物">
        <t-button theme="primary" @click="router.push({ name: 'my-plants' })">去添加植物</t-button>
      </t-empty>
    </div>

    <template v-else>
      <div v-if="hasMatchedTips" class="card-block">
        <div class="section-header">
          <h2 class="section-title">已匹配养护目录</h2>
          <t-tag theme="success" variant="light">共 {{ weeklyTips.matchedTips.length }} 株</t-tag>
        </div>
        <div class="tip-list">
          <div
            v-for="tip in weeklyTips.matchedTips"
            :key="tip.plantId"
            class="tip-card"
          >
            <div class="tip-card-header">
              <div class="plant-info">
                <span class="plant-name">{{ tip.plantName }}</span>
                <span v-if="tip.plantVariety" class="plant-variety">{{ tip.plantVariety }}</span>
              </div>
              <div class="attention-tags">
                <t-tag
                  v-for="tag in getAttentionTags(tip)"
                  :key="tag.label"
                  :theme="tag.theme"
                  variant="dark"
                  size="small"
                >
                  {{ tag.label }}
                </t-tag>
              </div>
            </div>
            <div class="tip-content">
              <p class="tip-text">{{ tip.tip }}</p>
              <div class="tip-details">
                <div v-if="tip.waterAdvice" class="detail-item">
                  <span class="detail-label">💧 浇水</span>
                  <span class="detail-value">{{ tip.waterAdvice }}</span>
                </div>
                <div v-if="tip.fertilizeAdvice" class="detail-item">
                  <span class="detail-label">🌱 施肥</span>
                  <span class="detail-value">{{ tip.fertilizeAdvice }}</span>
                </div>
                <div v-if="tip.sowAdvice" class="detail-item">
                  <span class="detail-label">🌾 种植</span>
                  <span class="detail-value">{{ tip.sowAdvice }}</span>
                </div>
              </div>
            </div>
            <div class="tip-card-footer">
              <t-link theme="primary" @click="goToCalendar(tip.plantName)">查看完整月历</t-link>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasUnmatchedTips" class="card-block">
        <div class="section-header">
          <h2 class="section-title">未匹配养护目录</h2>
          <t-tag theme="warning" variant="light">共 {{ weeklyTips.unmatchedTips.length }} 株</t-tag>
        </div>
        <div class="unmatched-list">
          <div
            v-for="tip in weeklyTips.unmatchedTips"
            :key="tip.plantId"
            class="unmatched-card"
          >
            <div class="unmatched-header">
              <span class="plant-name">{{ tip.plantName }}</span>
              <t-tag theme="warning" variant="light" size="small">未匹配</t-tag>
            </div>
            <p class="unmatched-tip">
              <t-icon name="info-circle" size="16px" />
              {{ tip.tip }}
            </p>
            <div class="unmatched-actions">
              <t-link theme="primary" @click="router.push({ name: 'encyclopedia' })">去植物百科查找</t-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s ease;
}

.tip-card:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
}

.tip-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.plant-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.plant-name {
  font-size: 16px;
  font-weight: 600;
  color: #14532d;
}

.plant-variety {
  font-size: 13px;
  color: #6b7280;
}

.attention-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.tip-content {
  margin-bottom: 12px;
}

.tip-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 12px;
}

.tip-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.detail-label {
  flex-shrink: 0;
  width: 70px;
  color: #6b7280;
}

.detail-value {
  flex: 1;
  color: #374151;
}

.tip-card-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.unmatched-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.unmatched-card {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 16px;
}

.unmatched-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.unmatched-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #92400e;
  margin: 0 0 12px;
  line-height: 1.6;
}

.unmatched-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
