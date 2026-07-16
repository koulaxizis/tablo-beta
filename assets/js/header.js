function loadTranslations(lang, callback) {
  if (window.TABLO_TRANSLATIONS[lang]) {
    if (callback) callback();
    // Also emit language loaded event
    setTimeout(function() {
      window.dispatchEvent(new CustomEvent('tablo:translationsLoaded'));
    }, 10);
    return;
  }
  var prefix = getPathPrefix();
  var url = prefix + 'assets/js/translations/' + lang + '.json';
  fetch(url)
    .then(function(response) {
      if (!response.ok) throw new Error('HTTP error ' + response.status);
      return response.json();
    })
    .then(function(data) {
      window.TABLO_TRANSLATIONS[lang] = data;
      if (callback) callback();
      // Emit event when translations loaded
      setTimeout(function() {
        window.dispatchEvent(new CustomEvent('tablo:translationsLoaded'));
      }, 10);
    })
    .catch(function(error) {
      console.error('Failed to load translations for', lang, ':', error);
      if (callback) callback();
    });
}