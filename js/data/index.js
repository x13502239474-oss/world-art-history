/* 站点索引数据：辅助分类，不是原著章节结构。 */
window.SITE_INDEX = {
  periods: [
    { id: 'prehistoric', name: '史前艺术', range: '约前 10 万—前 2000 年', status: 'ready', note: '完整叙事 · 19 件作品 · 11 个创作者档案 · 5 组跨文明比较' },
    { id: 'ancient', name: '古代文明艺术', range: '约前 3500—前 500 年', status: 'planned', note: '内容整理中' },
    { id: 'classical', name: '古典世界艺术', range: '约前 800—公元 400 年', status: 'planned', note: '内容整理中' },
    { id: 'medieval', name: '中世纪艺术', range: '约 400—1400 年', status: 'planned', note: '内容整理中' },
    { id: 'renaissance', name: '文艺复兴时期艺术', range: '约 1400—1600 年', status: 'planned', note: '内容整理中' },
    { id: 'early-modern', name: '近代艺术', range: '约 1600—1800 年', status: 'planned', note: '内容整理中' },
    { id: 'nineteenth', name: '19世纪艺术', range: '约 1800—1900 年', status: 'planned', note: '内容整理中' },
    { id: 'modern', name: '现代艺术', range: '约 1900—1970 年', status: 'planned', note: '内容整理中' },
    { id: 'contemporary', name: '当代艺术', range: '约 1970 年至今', status: 'planned', note: '内容整理中' }
  ],
  civilizations: [
    { id: 'europe', name: '欧洲艺术', region: 'europe', status: 'partial', note: '史前部分已完成', periods: ['prehistoric'] },
    { id: 'china', name: '中国艺术', region: 'east-asia', status: 'partial', note: '史前彩陶部分已完成', periods: ['prehistoric'] },
    { id: 'japan', name: '日本艺术', region: 'east-asia', status: 'partial', note: '史前绳文部分已完成', periods: ['prehistoric'] },
    { id: 'india', name: '印度艺术', region: 'south-asia', status: 'planned', note: '内容整理中', periods: [] },
    { id: 'southeast-asia', name: '东南亚艺术', region: 'southeast-asia', status: 'partial', note: '史前岩画部分已完成', periods: ['prehistoric'] },
    { id: 'islamic', name: '伊斯兰艺术', region: 'west-asia', status: 'planned', note: '内容整理中', periods: [] },
    { id: 'africa', name: '非洲艺术', region: 'africa', status: 'partial', note: '史前部分已完成', periods: ['prehistoric'] },
    { id: 'indigenous-americas', name: '美洲原住民艺术', region: 'americas', status: 'partial', note: '史前岩画部分已完成', periods: ['prehistoric'] },
    { id: 'ancient-americas', name: '古代美洲文明艺术', region: 'americas', status: 'partial', note: '卡拉尔部分已完成', periods: ['prehistoric'] },
    { id: 'oceania', name: '大洋洲艺术', region: 'oceania', status: 'partial', note: '史前岩画部分已完成', periods: ['prehistoric'] }
  ],
  regionNames: {
    europe: '欧洲',
    'west-asia': '西亚',
    'east-asia': '东亚',
    'south-asia': '南亚',
    'southeast-asia': '东南亚',
    africa: '非洲',
    americas: '美洲',
    oceania: '大洋洲'
  },
  sites: [
    { id: 'blombos', name: '布隆伯斯洞穴', region: 'africa', x: 55, y: 74, era: '旧石器时代', workId: 'blombos-ochre' },
    { id: 'tassili', name: '塔西里·恩·阿杰尔', region: 'africa', x: 49, y: 45, era: '新石器时代', workId: 'tassili' },
    { id: 'lascaux', name: '拉斯科洞窟', region: 'europe', x: 47, y: 31, era: '旧石器时代', workId: 'lascaux' },
    { id: 'chauvet', name: '肖韦洞窟', region: 'europe', x: 48, y: 32, era: '旧石器时代', workId: 'chauvet' },
    { id: 'willendorf', name: '维伦多夫', region: 'europe', x: 52, y: 29, era: '旧石器时代', workId: 'willendorf' },
    { id: 'hohlenstein', name: '施泰德尔洞穴', region: 'europe', x: 51, y: 30, era: '旧石器时代', workId: 'lion-man' },
    { id: 'catalhoyuk', name: '加泰土丘', region: 'west-asia', x: 57, y: 35, era: '新石器时代', workId: 'catalhoyuk' },
    { id: 'newgrange', name: '新格兰奇', region: 'europe', x: 45, y: 27, era: '新石器时代', workId: 'newgrange' },
    { id: 'stonehenge', name: '巨石阵', region: 'europe', x: 46, y: 29, era: '新石器时代', workId: 'stonehenge' },
    { id: 'banpo', name: '半坡', region: 'east-asia', x: 79, y: 39, era: '新石器时代', workId: 'banpo' },
    { id: 'jomon', name: '绳文遗址群', region: 'east-asia', x: 90, y: 39, era: '新石器时代', workId: 'jomon-bowl' },
    { id: 'sulawesi', name: '苏拉威西洞穴群', region: 'southeast-asia', x: 84, y: 57, era: '旧石器时代', workId: 'sulawesi-pig' },
    { id: 'kakadu', name: '卡卡杜', region: 'oceania', x: 89, y: 70, era: '旧石器—新石器', workId: 'kakadu' },
    { id: 'cueva', name: '手洞', region: 'americas', x: 25, y: 78, era: '中石器时代', workId: 'cueva-manos' },
    { id: 'caral', name: '卡拉尔', region: 'americas', x: 20, y: 51, era: '青铜时代早期', workId: 'caral' }
  ]
};
