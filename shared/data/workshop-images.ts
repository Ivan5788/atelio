/**
 * 工作坊照片的來源紀錄。
 *
 * 所有照片都透過 Openverse（https://openverse.org）搜尋，只挑選 CC0 或公眾領域（PDM）授權：
 * 不需標註作者、可修改、可商用。雖然授權不要求標註，仍保留來源，方便查證，也列在「關於」頁。
 * 照片僅用來示意課程類型，與網站上虛構的工作坊、講師沒有關係。
 *
 * 圖片檔已下載並轉成 WebP 存放在 public/images/workshops/，不依賴外部網站的穩定性。
 */
export interface WorkshopImageCredit {
  alt: string
  title: string
  creator: string
  source: string
  license: 'cc0' | 'pdm'
  url: string
}

export const WORKSHOP_IMAGE_WIDTHS = [640, 1280] as const

export const workshopImages: Record<string, WorkshopImageCredit> = {
  w01: {
    alt: '拉坯機上逐漸成形的陶碗，雙手正在修整碗口',
    title: 'Pottery class, Jaycee Park, USA',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/9658541/pottery-class-jaycee-park-usa',
  },
  w02: {
    alt: '雙手在轉盤上捏塑一塊淺色陶土',
    title: 'Pottery class, Jaycee Park, USA',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/9658656/pottery-class-jaycee-park-usa',
  },
  w03: {
    alt: '沾滿泥漿的雙手在旋轉的拉坯機上塑形',
    title: 'Free person making pottery image',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/5907112/photo-image-light-public-domain-hands',
  },
  w04: {
    alt: '棕色皮革上整齊的白色縫線特寫',
    title: 'IMG_9178',
    creator: 'jcfrog',
    source: 'flickr',
    license: 'cc0',
    url: 'https://www.flickr.com/photos/21717345@N03/7636584096',
  },
  w05: {
    alt: '牆上掛滿各式皮革工具：錐子、菱斬與木柄刀具',
    title: 'Free crafting tools image',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/5922235/photo-image-public-domain-wood-free',
  },
  w06: {
    alt: '工作檯上擺滿皮料與工具，師傅正在製作皮件',
    title: 'person crafting various trinkets leather',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/3293846/free-photo-image-create-accessory-apparel',
  },
  w07: {
    alt: '深色桌面上的向日葵、剪刀與植物圖鑑',
    title: 'Book Table',
    creator: 'Vintage RS',
    source: 'stocksnap',
    license: 'cc0',
    url: 'https://stocksnap.io/photo/book-table-XNTTKRUSF1',
  },
  w08: {
    alt: '一位女子抱著一大束黃色與粉色的鮮花',
    title: 'Woman Holding',
    creator: 'Kelly Ishmael',
    source: 'stocksnap',
    license: 'cc0',
    url: 'https://stocksnap.io/photo/woman-holding-RFP4F66IW9',
  },
  w09: {
    alt: '木桌上的粉色金魚草、花剪與深色餐盤',
    title: 'Rustic Table',
    creator: 'Vintage RS',
    source: 'stocksnap',
    license: 'cc0',
    url: 'https://stocksnap.io/photo/rustic-table-0XANHS5ZKW',
  },
  w10: {
    alt: '木箱裡堆滿木活字，中間排出英文字樣',
    title: 'Alphabet letterpress',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/6029759/photo-image-public-domain-wood-letter',
  },
  w11: {
    alt: '色彩鮮豔的花卉版畫，藍紫色與紅色花朵',
    title:
      'Cyclamen and Cineraria. Seiyo Soka Zufu (A Picture Album of Western Plants and Flowers) Woodblock print by Tanigami Konan (1917).',
    creator: 'Swallowtail Garden Seeds',
    source: 'flickr',
    license: 'pdm',
    url: 'https://www.flickr.com/photos/97123293@N07/15641428252',
  },
  w12: {
    alt: '黑白木刻版畫，刻出盛開的花朵與葉片',
    title: 'Cyclamen (1920) print high resolution',
    creator: 'rijksmuseum',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/2697485/free-illustration-image-pattern-black-and-white-samuel-jessurun-mesquita',
  },
  w13: {
    alt: '沾水筆放在寫滿英文書法字的紙上',
    title: 'Free old English calligraphy closeup',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/5920366/photo-image-background-paper-book',
  },
  w14: {
    alt: '鋼筆筆尖在橫線紙上書寫的特寫',
    title: 'Close-up fountain pen writing notebook',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/3284166/free-photo-image-fountain-pen-writer-writing',
  },
  w15: {
    alt: '直行書寫的中文書法作品，紙上蓋有紅色印章',
    title: 'Letter to Liang Zhongren',
    creator: 'themet',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/9087800/letter-liang-zhongren',
  },
  w16: {
    alt: '用刀在木墩上削切木條',
    title: 'Man cuts wood snowy stump',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/3337486/free-photo-image-hand-and-wood-apparel-axe',
  },
  w17: {
    alt: '工匠在木工檯上用直尺與工具加工木板',
    title: 'elderly person cutting large sheet',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/3303977/free-photo-image-cat-beekeeper-animal',
  },
  w18: {
    alt: '木造工坊內牆上掛滿手工具，窗外透進光線',
    title: 'THE SHOP',
    creator: 'PHOTOSHOP LOGIC',
    source: 'flickr',
    license: 'cc0',
    url: 'https://www.flickr.com/photos/52904639@N08/17630933414',
  },
  w19: {
    alt: '深藍色底上有白色紋路的絞染藍染布',
    title: 'Panel, cotton, tie dyed indigo',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/7637652/photo-image-art-vintage-public-domain',
  },
  w20: {
    alt: '深紅色布面上以紅色絲線繡出的花卉圖樣',
    title: 'No backing cloth. Hand jwoven',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/7654432/image-vintage-art-border',
  },
  w21: {
    alt: '以植物色調染出橘褐色花鳥紋樣的長布',
    title: "Woman's Hip Wrapper (Sarung Bang Biru Hijau) LACMA M.91.184.309",
    creator: 'Fæ',
    source: 'flickr',
    license: 'pdm',
    url: 'https://www.flickr.com/photos/50398299@N08/16265739398',
  },
  w22: {
    alt: '水彩畫：藍色天空下草原上的一棵大樹',
    title: 'Tree',
    creator: 'deborah.soltesz',
    source: 'flickr',
    license: 'cc0',
    url: 'https://www.flickr.com/photos/10836653@N05/3477786458',
  },
  w23: {
    alt: '以墨線快速描繪的城市街景速寫',
    title: 'Sketchbook - 40 sheets Cyprián',
    creator: '',
    source: 'rawpixel',
    license: 'cc0',
    url: 'https://www.rawpixel.com/image/12678699/sketchbook-sheets-cyprian-majernik',
  },
  w24: {
    alt: '一位繪者在紙上畫卡通角色',
    title: 'Halloween drawing',
    creator: 'freestocks.org',
    source: 'flickr',
    license: 'cc0',
    url: 'https://www.flickr.com/photos/135396164@N05/30448065541',
  },
}

/** 工作坊 id → 圖片網址與替代文字；沒有照片（例如 Studio 自建的工作坊）時回傳 null，改用插畫封面 */
export function workshopImageFor(id: string): { src: string; srcset: string; alt: string } | null {
  const credit = workshopImages[id]
  if (!credit) return null
  const url = (width: number) => `/images/workshops/${id}-${width}.webp`
  return {
    src: url(640),
    srcset: WORKSHOP_IMAGE_WIDTHS.map((w) => `${url(w)} ${w}w`).join(', '),
    alt: credit.alt,
  }
}
