/**
 * 介面上固定顯示的名稱。分類與城市的名稱也存在 seed 資料中，
 * 這裡保留一份是為了讓導覽列、篩選器不必為了顯示名稱而多打一次 API。
 * tests/unit/labels.spec.ts 會檢查兩邊一致。
 */
import type { CategorySlug, CitySlug } from '#shared/types/domain'

export const CATEGORY_NAMES: Record<CategorySlug, string> = {
  ceramics: '陶藝',
  leathercraft: '皮革',
  floral: '花藝',
  printmaking: '版畫・印刷',
  typography: '字體・書法',
  woodworking: '木工',
  textile: '織品・染布',
  illustration: '插畫・水彩',
}

export const CITY_NAMES: Record<CitySlug, string> = {
  taipei: '台北',
  'new-taipei': '新北',
  taoyuan: '桃園',
  taichung: '台中',
  tainan: '台南',
  kaohsiung: '高雄',
}
