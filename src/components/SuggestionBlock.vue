<script setup lang="ts">
import { computed } from 'vue';
import type { MonthSuggestion } from '@/types';

interface Props {
  suggestion: MonthSuggestion | null;
  cityName?: string;
  plantName?: string;
  mode?: 'card' | 'inline';
  cardLayout?: 'grid' | 'stack';
  emptyText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'card',
  cardLayout: 'stack',
});

const finalEmptyText = computed(() => {
  if (props.emptyText) return props.emptyText;
  if (props.cityName && props.plantName) {
    return `${props.cityName}暂无「${props.plantName}」的当月建议`;
  }
  if (props.plantName) {
    return `暂无「${props.plantName}」的当月建议`;
  }
  if (props.cityName) {
    return `${props.cityName}暂无当月建议`;
  }
  return '暂无当月养护建议';
});

const suggestionItems = computed(() => [
  { key: 'sow', icon: '🌱', label: '播种建议', content: props.suggestion?.sow ?? '', color: 'sow' },
  { key: 'water', icon: '💧', label: '浇水建议', content: props.suggestion?.water ?? '', color: 'water' },
  { key: 'fertilize', icon: '🧪', label: '施肥建议', content: props.suggestion?.fertilize ?? '', color: 'fertilize' },
]);
</script>

<template>
  <template v-if="suggestion">
    <template v-if="mode === 'card'">
      <t-row v-if="cardLayout === 'grid'" :gutter="[12, 12]">
        <t-col :span="12" v-for="item in suggestionItems" :key="item.key">
          <t-card :bordered="true" size="small" :title="`${item.icon} ${item.label}`">
            <p>{{ item.content }}</p>
          </t-card>
        </t-col>
      </t-row>
      <div v-else class="suggestion-card-stack">
        <t-card
          v-for="item in suggestionItems"
          :key="item.key"
          :bordered="true"
          size="small"
          :title="`${item.icon} ${item.label}`"
          class="suggestion-card"
        >
          <p>{{ item.content }}</p>
        </t-card>
      </div>
    </template>
    <template v-else>
      <div class="suggestion-inline-list">
        <div v-for="item in suggestionItems" :key="item.key" :class="['suggestion-inline-item', item.color]">
          <div class="suggestion-inline-icon">{{ item.icon }}</div>
          <div class="suggestion-inline-content">
            <div class="suggestion-inline-label">{{ item.label }}</div>
            <div class="suggestion-inline-text">{{ item.content }}</div>
          </div>
        </div>
      </div>
    </template>
  </template>
  <div v-else class="suggestion-empty">
    <t-empty :description="finalEmptyText" size="small" />
  </div>
</template>

<style scoped>
.suggestion-card-stack {
  display: flex;
  flex-direction: column;
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

.suggestion-inline-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-inline-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.suggestion-inline-item.sow {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.suggestion-inline-item.water {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.suggestion-inline-item.fertilize {
  background: #fffbeb;
  border-color: #fde68a;
}

.suggestion-inline-icon {
  font-size: 20px;
  flex-shrink: 0;
  line-height: 1.2;
}

.suggestion-inline-content {
  flex: 1;
  min-width: 0;
}

.suggestion-inline-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 2px;
}

.suggestion-inline-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.suggestion-empty {
  padding: 8px 0;
}
</style>
