import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import formulaData, { SECTION_ORDER } from '@/data/formulas-university'
import type { FormulaMap, Section } from '@/data/types'

export interface FlatIndexItem {
  sectionId: string
  sectionTitle: string
  index: number
  searchText: string
  level?: string
}

function buildFlatIndex(data: FormulaMap): FlatIndexItem[] {
  const items: FlatIndexItem[] = []
  for (const [sectionId, section] of Object.entries(data)) {
    section.formulas.forEach((f, i) => {
      items.push({
        sectionId,
        sectionTitle: section.title,
        index: i,
        searchText: `${f.name} ${f.latex} ${f.note} ${f.detail || ''}`.toLowerCase(),
        level: f.level,
      })
    })
  }
  return items
}

export const useFormulaStore = defineStore('formulas', () => {
  const data = ref<FormulaMap>(formulaData)
  const flatIndex = ref<FlatIndexItem[]>(buildFlatIndex(data.value))
  const currentSection = ref<string>(SECTION_ORDER[0] || 'calc-limit')
  const isGridView = ref(false)
  // 预留多学段扩展
  const currentGrade = ref<string>('university')

  const currentSectionData = computed<Section | null>(
    () => data.value[currentSection.value] || null
  )

  const currentFormulas = computed(() => {
    return currentSectionData.value?.formulas || []
  })

  function navigateToSection(sectionId: string) {
    if (data.value[sectionId]) {
      currentSection.value = sectionId
    }
  }

  function toggleGridView() {
    isGridView.value = !isGridView.value
  }

  return {
    data,
    flatIndex,
    currentSection,
    isGridView,
    currentGrade,
    SECTION_ORDER,
    currentSectionData,
    currentFormulas,
    navigateToSection,
    toggleGridView,
  }
})
