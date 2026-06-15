<script setup lang="ts">
import dayjs from 'dayjs';
import { MessagePlugin } from 'tdesign-vue-next';
import { useRouter } from 'vue-router';
import { computed, ref } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';
import { useCalendarStore } from '@/stores/calendar';

const favoritesStore = useFavoritesStore();
const calendarStore = useCalendarStore();
const router = useRouter();

const deleteConfirmVisible = ref(false);
const deletingId = ref<string | null>(null);

const favoriteList = computed(() => favoritesStore.sortedItems);

/**
 * 跳转到月历页并应用筛选条件
 */
function goToCalendar(favorite: { cityId: string; plantId: string }) {
  calendarStore.setCity(favorite.cityId);
  calendarStore.setPlant(favorite.plantId);
  router.push('/');
}

/**
 * 打开删除确认
 */
function openDeleteConfirm(id: string) {
  deletingId.value = id;
  deleteConfirmVisible.value = true;
}

/**
 * 确认删除
 */
function confirmDelete() {
  if (deletingId.value) {
    favoritesStore.removeFavorite(deletingId.value);
    MessagePlugin.success('已取消收藏');
  }
  deleteConfirmVisible.value = false;
  deletingId.value = null;
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">我的收藏</h1>
        <p class="page-desc">收藏常用的城市与植物组合，快速切换查看种植建议。</p>
      </div>
      <t-tag theme="primary" variant="light">共 {{ favoriteList.length }} 个收藏</t-tag>
    </div>

    <div v-if="favoriteList.length > 0" class="favorite-grid">
      <t-card
        v-for="item in favoriteList"
        :key="item.id"
        class="favorite-card"
        :bordered="true"
        hover
        @click="goToCalendar(item)"
      >
        <div class="card-content">
          <div class="card-main">
            <div class="favorite-title">
              <span class="star-icon">★</span>
              <span class="plant-name">{{ item.plantName }}</span>
            </div>
            <div class="favorite-city">
              <t-tag theme="success" variant="light">{{ item.cityName }}</t-tag>
            </div>
          </div>
          <div class="card-footer">
            <span class="create-time">收藏于 {{ dayjs(item.createdAt).format('YYYY-MM-DD') }}</span>
            <t-button
              size="small"
              variant="outline"
              theme="danger"
              @click.stop="openDeleteConfirm(item.id)"
            >
              删除
            </t-button>
          </div>
        </div>
      </t-card>
    </div>

    <div v-else class="empty-wrapper">
      <t-empty description="暂无收藏，去月历页收藏常用组合吧">
        <t-button theme="primary" @click="router.push('/')">去月历页</t-button>
      </t-empty>
    </div>

    <t-dialog
      v-model:visible="deleteConfirmVisible"
      header="确认删除"
      :on-confirm="confirmDelete"
    >
      <p>确定要取消收藏这个组合吗？</p>
    </t-dialog>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.favorite-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.favorite-card {
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.favorite-card:hover {
  box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.favorite-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #14532d;
}

.star-icon {
  color: #f59e0b;
  font-size: 20px;
}

.plant-name {
  flex: 1;
}

.favorite-city {
  display: flex;
  align-items: center;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
}

.create-time {
  font-size: 12px;
  color: #94a3b8;
}

.empty-wrapper {
  padding: 48px 0;
}
</style>
