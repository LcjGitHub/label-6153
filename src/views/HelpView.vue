<script setup lang="ts">
import { helpSections } from '@/data/helpData';
</script>

<template>
  <div class="help-page">
    <div class="page-header">
      <h1 class="page-title">使用帮助</h1>
      <p class="page-desc">了解各功能模块的操作方式与常见问题</p>
    </div>

    <t-collapse :default-value="[]">
      <t-collapse-panel
        v-for="section in helpSections"
        :key="section.id"
        :value="section.id"
      >
        <template #header>
          <span class="panel-header">
            <span class="panel-icon">{{ section.icon }}</span>
            <span class="panel-title">{{ section.title }}</span>
          </span>
        </template>

        <div class="section-body">
          <p class="section-desc">{{ section.description }}</p>

          <div class="subsection">
            <h3 class="subsection-title">操作步骤</h3>
            <ol class="steps-list">
              <li v-for="(step, idx) in section.steps" :key="idx" class="step-item">
                <span class="step-label">{{ step.label }}</span>
                <span class="step-text">{{ step.text }}</span>
              </li>
            </ol>
          </div>

          <div v-if="section.faqs.length" class="subsection">
            <h3 class="subsection-title">常见问题</h3>
            <div class="faq-list">
              <div v-for="(faq, idx) in section.faqs" :key="idx" class="faq-item">
                <div class="faq-question">Q：{{ faq.question }}</div>
                <div class="faq-answer">A：{{ faq.answer }}</div>
              </div>
            </div>
          </div>
        </div>
      </t-collapse-panel>
    </t-collapse>
  </div>
</template>

<style scoped>
.help-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 28px 20px 60px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 600;
  color: #14532d;
}

.page-desc {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  font-size: 18px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.section-body {
  padding: 4px 0;
}

.section-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
}

.subsection {
  margin-bottom: 20px;
}

.subsection:last-child {
  margin-bottom: 0;
}

.subsection-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #14532d;
}

.steps-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
  counter-reset: step-counter;
}

.steps-list li {
  counter-increment: step-counter;
  position: relative;
  padding-left: 28px;
  margin-bottom: 10px;
}

.steps-list li::before {
  content: counter(step-counter);
  position: absolute;
  left: 0;
  top: 1px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #dcfce7;
  color: #14532d;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-item {
  line-height: 1.6;
}

.step-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-right: 6px;
}

.step-text {
  font-size: 14px;
  color: #475569;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.faq-question {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}

.faq-answer {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}
</style>
