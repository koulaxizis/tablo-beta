(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var headerEl = document.getElementById('tablo-header');
    if (!headerEl) return;

    headerEl.innerHTML =
      '<header class="header">' +
        '<div class="header-content">' +
          '<div class="header-left">' +
            '<a href="../index.html" class="logo-link">' +
              '<img src="../assets/images/favicon.svg" alt="tablo" class="logo-icon" />' +
              '<span class="logo-text">tablo</span>' +
            '</a>' +
          '</div>' +
          '<div class="header-right">' +
            '<select id="language-select" class="lang-select" aria-label="Language"></select>' +
            '<button id="btn-settings" class="header-btn" data-i18n-aria="aria_settings" aria-label="Settings" title="Settings"><i class="fa fa-cog"></i></button>' +
            '<button id="theme-toggle" class="header-btn" data-i18n-aria="aria_theme_toggle" aria-label="Toggle theme" title="Toggle theme"><i class="fa fa-sun-o"></i></button>' +
          '</div>' +
        '</div>' +
      '</header>';
  });
})();