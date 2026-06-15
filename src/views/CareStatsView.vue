<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCareRecordsStore } from '@/stores/careRecords';

const router = useRouter();
const careRecordsStore = useCareRecordsStore();

const stats = computed(() => careRecordsStore.statsSummary);

const hasRecords = computed(() => stats.value.totalRecords > 0);

const typeCardColors: Record<string, string> = {
  water: '#36bffa',
  fertilize: '#f59e0b',
  repot: '#10b981',
};

const typeCardIcons: Record<string, string> = {
  water: '💧',
  fertilize: '🌱',
  repot: '🪴',
};

const tableColumns = [
  { colKey: 'plantName', title: '植物名称', width: 200 },
  { colKey: 'totalCount', title: '总次数', width: 100 },
  { colKey: 'waterCount', title: '浇水', width: 100 },
  { colKey: 'fertilizeCount', title: '施肥', width: 100 },
  { colKey: 'repotCount', title: '换盆', width: 100 },
];

function goToCareRecords() {
  router.push('/care-records');
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">养护数据统计</h1>
        <p class="page-desc">按养护类型和植物维度统计养护记录，直观了解养护频率与植物分布。</p>
      </div>
    </div>

    <div v-if="!hasRecords" class="empty-state card-block">
      <t-empty description="暂无养护记录数据">
        <t-button theme="primary" @click="goToCareRecords">前往养护记录</t-button>
      </t-empty>
    </div>

    <template v-else>
      <div class="stats-section">
        <h2 class="section-title">养护类型统计</h2>
        <div class="type-cards">
          <div
            v-for="item in stats.typeStats"
            :key="item.type"
            class="type-card"
            :style="{ borderLeftColor: typeCardColors[item.type] }"
          >
            <div class="type-card-icon">{{ typeCardIcons[item.type] }}</div>
            <div class="type-card-content">
              <div class="type-card-label">{{ item.label }}</div>
              <div class="type-card-count">{{ item.count }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h2 class="section-title">按植物统计</h2>
        <div class="card-block">
          <t-table
            row-key="plantName"
            :data="stats.plantStats"
            :columns="tableColumns"
            stripe
            hover
          >
            <template #totalCount="{ row }">
              <span class="total-count">{{ row.totalCount }}</span>
            </template>
          </t-table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.stats-section {
  margin-bottom: 24px;
}

.type-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.type-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
  border-left: 4px solid;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
}

.type-card-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.type-card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-card-label {
  font-size: 14px;
  color: #6b7280;
}

.type-card-count {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.total-count {
  font-weight: 600;
  color: #165dff;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

@media (max-width: 768px) {
  .type-cards {
    grid-template-columns: 1fr;
  }
}
</style>
