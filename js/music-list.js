/**
 * 本地歌单清单 —— 换歌 / 改歌名 / 调顺序，只动这个文件
 *
 * url      : 音频路径。文件放在 source/audio/music/，用英文短名，避免 URL 百分号编码
 * name     : 界面显示的歌名（中文随你写，和文件名无关）
 * artist   : 界面显示的歌手 / 出处
 * duration : 秒。面板右侧的时长靠它，删掉就显示 --:--
 *
 * 注意：music.js 依赖本文件先加载，inject 顺序不要调换。
 */
window.MUSIC_LIST = [
  { name: 'Storyteller',        artist: '明日方舟「巴别塔」',     url: '/audio/music/01-storyteller.m4a',     duration: 118 },
  { name: '宿命 Decretum',      artist: '魔法少女小圆 · 八音盒',  url: '/audio/music/02-decretum.m4a',        duration: 110 },
  { name: 'コネクト（羁绊）',    artist: '魔法少女小圆 OP · 八音盒', url: '/audio/music/03-connect.m4a',         duration: 107 },
  { name: '不为人知的鹅妈妈童谣', artist: 'wowaka',               url: '/audio/music/04-mother-goose.m4a',    duration: 289 },
  { name: 'Mother - Outro',     artist: '终焉之莉莉 · 八音盒',    url: '/audio/music/05-mother-outro.m4a',    duration: 115 },
  { name: 'Harmonious',         artist: '终焉之莉莉 · 八音盒',    url: '/audio/music/06-harmonious.m4a',      duration: 148 },
  { name: 'Only My Railgun',    artist: '某科学的超电磁炮 · 八音盒', url: '/audio/music/07-railgun.m4a',         duration: 128 },
  { name: 'Sis Puella Magica',  artist: '魔法少女小圆 · 八音盒',  url: '/audio/music/08-sis-puella.m4a',      duration: 160 },
  { name: '妄想感傷代償連盟',    artist: '八音盒',                url: '/audio/music/09-daishou-rengou.m4a',  duration: 109 },
  { name: '蜘蛛糸モノポリー',    artist: '八音盒',                url: '/audio/music/10-monopoly.m4a',        duration: 141 },
  { name: '铁线莲',             artist: '八音盒',                url: '/audio/music/11-clematis.m4a',        duration: 224 },
  { name: 'Harmonious（内录）',  artist: '终焉之莉莉 · 八音盒',    url: '/audio/music/12-harmonious-rec.m4a',  duration: 122 },
  { name: '吸血鬼',             artist: 'DECO*27',               url: '/audio/music/13-vampire.m4a',         duration: 94 },
  { name: '永不枯萎的花',        artist: '异世界情绪',            url: '/audio/music/14-eternal-flower.m4a',  duration: 105 },
  { name: '遊園施設',           artist: '尼尔：机械纪元 · 八音盒', url: '/audio/music/15-yuenchi.m4a',         duration: 277 },
  { name: '被生命所厌恶。',      artist: 'カンザキイオリ',         url: '/audio/music/16-kiraware.m4a',        duration: 99 },
  { name: '视奸',               artist: 'DECO*27',               url: '/audio/music/17-shisen.m4a',          duration: 100 }
];
