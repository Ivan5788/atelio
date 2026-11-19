/**
 * 示範資料：分類、城市、講師。全部為虛構內容（docs/01-PRD.md 資料誠信聲明）。
 * 以 TS 模組而不是執行時讀 JSON 檔：建置時直接打包，Vercel Functions 上不會有找不到檔案路徑的問題（ADR-003）。
 */
import type { CategorySlug, CitySlug, Instructor } from '#shared/types/domain'

export interface CategorySeed {
  slug: CategorySlug
  name: string
  intro: string
}

export const categories: CategorySeed[] = [
  {
    slug: 'ceramics',
    name: '陶藝',
    intro:
      '陶藝課大致分為手捏、拉坯與上釉三種。第一次上課建議從手捏或拉坯入門，課程通常 2 到 3 小時，作品需要工作室代為燒製，約 3 到 5 週後取件。',
  },
  {
    slug: 'leathercraft',
    name: '皮革',
    intro:
      '皮革工作坊多以植鞣革製作卡套、短夾、鑰匙圈等小物，使用菱斬打孔、雙針手縫。當天就能帶走成品，適合想要實用作品的人。',
  },
  {
    slug: 'floral',
    name: '花藝',
    intro:
      '花藝課包含鮮花花束、乾燥花圈與盆花設計。鮮花作品當天帶走，乾燥花則能保存半年以上。課程多在 2 小時內完成，是最容易入門的手作類型之一。',
  },
  {
    slug: 'printmaking',
    name: '版畫・印刷',
    intro:
      '從橡皮章、木刻版畫到活版印刷，版畫課讓你理解「反向雕刻、正向印出」的過程。活版印刷課通常會使用鉛字排版，印出名片或卡片。',
  },
  {
    slug: 'typography',
    name: '字體・書法',
    intro:
      '字體課程涵蓋硬筆字、英文書法與中文書法。課程著重筆畫結構與節奏，適合想改善字跡，或想在卡片、包裝上寫出好看文字的人。',
  },
  {
    slug: 'woodworking',
    name: '木工',
    intro:
      '木工入門課多以手工具製作湯匙、托盤、小凳子。課堂會說明工具安全與木材特性，作品打磨上油後即可帶回使用。',
  },
  {
    slug: 'textile',
    name: '織品・染布',
    intro:
      '織品課包括藍染、植物染、刺繡與小型織布。染布作品需要清洗與晾乾，部分工作室會提供塑膠袋讓學員帶回家後再處理。',
  },
  {
    slug: 'illustration',
    name: '插畫・水彩',
    intro:
      '水彩與插畫課從工具認識、調色、渲染技法開始，再進入完整作品。適合想培養日常繪畫習慣的人，多數課程不需要任何繪畫基礎。',
  },
]

export interface CitySeed {
  slug: CitySlug
  name: string
  intro: string
}

export const cities: CitySeed[] = [
  {
    slug: 'taipei',
    name: '台北',
    intro: '台北的工作室集中在大安、中山與大同區，捷運可達性高，平日晚間與週末都有場次。',
  },
  {
    slug: 'new-taipei',
    name: '新北',
    intro: '新北的工作室空間較寬敞，適合需要大型器材的木工與陶藝課程，板橋、三重交通最便利。',
  },
  {
    slug: 'taoyuan',
    name: '桃園',
    intro: '桃園的工作坊以週末課程為主，多數提供停車空間，適合開車前往的家庭與朋友。',
  },
  {
    slug: 'taichung',
    name: '台中',
    intro: '台中西區與南屯有許多獨立工作室，皮革與花藝課程的選擇特別多。',
  },
  {
    slug: 'tainan',
    name: '台南',
    intro: '台南的工作坊多在中西區老屋裡，課程步調較慢，常結合在地材料與傳統工藝。',
  },
  {
    slug: 'kaohsiung',
    name: '高雄',
    intro: '高雄鹽埕與駁二周邊聚集了版畫、織品與插畫工作室，課後很適合順道散步。',
  },
]

export const instructors: Instructor[] = [
  {
    slug: 'chen-yihe',
    name: '陳以禾',
    studio: '土窯工作室',
    title: '陶藝家・工作室主理人',
    bio: '大學主修工業設計，畢業後到鶯歌學習拉坯與釉藥。開設拉坯課程 6 年，習慣以一對四的小班制教學，讓每位學員都能被調整到手勢。',
    yearsTeaching: 6,
    categories: ['ceramics'],
  },
  {
    slug: 'lin-shuyao',
    name: '林書瑤',
    studio: '平行線皮件',
    title: '皮件設計師',
    bio: '曾在皮件品牌擔任打版師，現在經營個人工作室。課程重視手縫的線距與收邊細節，希望學員做出能用很多年的東西。',
    yearsTeaching: 8,
    categories: ['leathercraft'],
  },
  {
    slug: 'huang-yuting',
    name: '黃語婷',
    studio: '小日花室',
    title: '花藝設計師',
    bio: '從婚禮花藝起家，近年專注乾燥花與季節花材。課堂上會解釋配色與比例，讓學員回家也能自己搭配。',
    yearsTeaching: 5,
    categories: ['floral'],
  },
  {
    slug: 'wu-chengen',
    name: '吳承恩',
    studio: '鉛與紙印刷所',
    title: '活版印刷師',
    bio: '收藏超過三萬顆鉛字，維護兩台海德堡圓盤機。希望讓更多人親手體驗排版與印刷，理解每個字的重量。',
    yearsTeaching: 10,
    categories: ['printmaking'],
  },
  {
    slug: 'tsai-mingche',
    name: '蔡明哲',
    studio: '一筆字房',
    title: '書法與字體設計講師',
    bio: '字體設計師，同時教授英文書法與硬筆字。教學從筆畫結構切入，讓學員理解「好看的字」背後的規則。',
    yearsTeaching: 7,
    categories: ['typography'],
  },
  {
    slug: 'kuo-zhiwei',
    name: '郭志偉',
    studio: '木木製所',
    title: '木工職人',
    bio: '家具木工出身，以手工具教學為主。課程從工具安全開始，重視每一位學員都能安全地完成作品。',
    yearsTeaching: 9,
    categories: ['woodworking'],
  },
  {
    slug: 'hsu-anqi',
    name: '許安琪',
    studio: '藍日染織',
    title: '染織工藝師',
    bio: '在三峽學習藍染後回到台南開設工作室，使用自建的藍靛缸。課程也包含植物染與簡單的刺繡。',
    yearsTeaching: 6,
    categories: ['textile'],
  },
  {
    slug: 'yang-xiaoyun',
    name: '楊曉雲',
    studio: '水日子畫室',
    title: '插畫家',
    bio: '自由插畫家，作品常見於書籍封面。教學著重觀察與調色，讓沒有繪畫基礎的人也能畫出有氛圍的作品。',
    yearsTeaching: 4,
    categories: ['illustration'],
  },
]
