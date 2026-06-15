<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => route.path);

/**
 * 顶部导航切换
 */
function handleMenuChange(value: string) {
  router.push(value);
}
</script>

<template>
  <t-layout class="app-layout">
    <t-header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <span class="brand-icon">🌿</span>
          <span class="brand-text">城市阳台种植月历</span>
        </div>
        <t-head-menu
          :value="activeMenu"
          theme="light"
          @change="handleMenuChange"
        >
          <t-menu-item value="/">月历建议</t-menu-item>
          <t-menu-item value="/encyclopedia">植物百科</t-menu-item>
          <t-menu-item value="/dashboard">植物总览看板</t-menu-item>
          <t-menu-item value="/city-compare">双城对比</t-menu-item>
          <t-menu-item value="/favorites">我的收藏</t-menu-item>
          <t-menu-item value="/my-plants">我的植物</t-menu-item>
          <t-menu-item value="/care-records">养护记录</t-menu-item>
          <t-menu-item value="/care-stats">养护统计</t-menu-item>
          <t-menu-item value="/settings">设置</t-menu-item>
        </t-head-menu>
      </div>
    </t-header>
    <t-content>
      <router-view />
    </t-content>
  </t-layout>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #f3f6f4;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

.brand-icon {
  font-size: 22px;
}

.brand-text {
  font-size: 18px;
  font-weight: 600;
  color: #14532d;
}

:deep(.t-head-menu) {
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

:deep(.t-head-menu .t-menu__item) {
  white-space: nowrap;
  flex-shrink: 0;
  padding: 0 14px;
}

@media (max-width: 1024px) {
  .header-inner {
    gap: 8px;
    padding: 0 12px;
  }

  :deep(.t-head-menu .t-menu__item) {
    padding: 0 10px;
    font-size: 13px;
  }

  .brand-text {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  :deep(.t-head-menu .t-menu__item) {
    padding: 0 8px;
    font-size: 12px;
  }

  .brand-text {
    font-size: 14px;
  }
}
</style>
