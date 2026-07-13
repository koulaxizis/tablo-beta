// ============================================
// tablo — Central Config
// ============================================

var TABLO_CONFIG = {
  baseHref: '/tablo-beta/',
  version: '0.2.0',
  channel: 'beta',
  domain: 'https://koulaxizis.github.io/tablo-beta',
  cacheName: 'tablo-v0.2.0'
};

if (typeof window !== 'undefined') {
  window.TABLO_CONFIG = TABLO_CONFIG;
}