import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { CareRecord } from '@/types';
import type { ImportMode } from '@/utils/importExport';
import { calculateCareStats, type CareStatsSummary } from '@/utils/careStats';

export interface CareRecordsImportResult {
  added: number;
  updated: number;
}

export const useCareRecordsStore = defineStore(
  'careRecords',
  () => {
    const items = ref<CareRecord[]>([]);

    const sortedItems = computed(() =>
      [...items.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    );

    function addRecord(payload: Omit<CareRecord, 'id'>) {
      const record: CareRecord = {
        id: crypto.randomUUID(),
        ...payload,
      };
      items.value.unshift(record);
      return record;
    }

    function removeRecord(id: string) {
      const index = items.value.findIndex((r) => r.id === id);
      if (index === -1) return false;

      items.value.splice(index, 1);
      return true;
    }

    function findById(id: string) {
      return items.value.find((r) => r.id === id) ?? null;
    }

    function getAll(): CareRecord[] {
      return [...items.value];
    }

    function replaceAll(newItems: CareRecord[]): void {
      items.value = [...newItems];
    }

    function importCareRecords(
      incoming: CareRecord[],
      mode: ImportMode,
    ): CareRecordsImportResult {
      const result: CareRecordsImportResult = { added: 0, updated: 0 };

      if (mode === 'overwrite') {
        items.value = [...incoming];
        result.added = incoming.length;
        return result;
      }

      for (const record of incoming) {
        const existingIdx = items.value.findIndex((r) => r.id === record.id);
        if (existingIdx === -1) {
          items.value.push({ ...record });
          result.added++;
        } else {
          items.value[existingIdx] = { ...record };
          result.updated++;
        }
      }

      return result;
    }

    function clearAll(): void {
      items.value = [];
    }

    function removeByPlantId(plantId: string): number {
      const before = items.value.length;
      items.value = items.value.filter((r) => r.plantId !== plantId);
      return before - items.value.length;
    }

    const statsSummary = computed<CareStatsSummary>(() => {
      return calculateCareStats(items.value);
    });

    function getStatsSummary(): CareStatsSummary {
      return calculateCareStats(items.value);
    }

    return {
      items,
      sortedItems,
      statsSummary,
      addRecord,
      removeRecord,
      findById,
      getAll,
      replaceAll,
      importCareRecords,
      clearAll,
      removeByPlantId,
      getStatsSummary,
    };
  },
  {
    persist: {
      key: 'balcony-care-records',
    },
  },
);
