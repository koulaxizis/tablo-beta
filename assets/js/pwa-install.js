// ============================================
// tablo — PWA Install Handler
// ============================================

(function() {
  'use strict';

  var deferredPrompt = null;
  var installBanner = document.getElementById('install-banner');
  var installBtn = document.getElementById('btn-install-now');
  var dismissBtn = document.getElementById('btn-dismiss-install');

  // ========== BEFORE INSTALL PROMPT ==========
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install banner if user hasn't dismissed
    if (localStorage.getItem('tablo-install-dismissed') !== 'true') {
      showInstallBanner();
    }
  });

  function showInstallBanner() {
    if (installBanner) {
      installBanner.style.display = '';
    }
  }

  function hideInstallBanner() {
    if (installBanner) {
      installBanner.style.display = 'none';
    }
  }

  // ========== INSTALL BUTTON ==========
  if (installBtn) {
    installBtn.addEventListener('click', function() {
      if (!deferredPrompt) return;
      
      deferredPrompt.prompt();
      
      deferredPrompt.userChoice.then(function(result) {
        if (result.outcome === 'accepted') {
          console.log('User accepted install prompt');
          localStorage.setItem('tablo-install-dismissed', 'true');
        } else {
          console.log('User dismissed install prompt');
        }
        deferredPrompt = null;
        hideInstallBanner();
      });
    });
  }

  // ========== DISMISS BUTTON ==========
  if (dismissBtn) {
    dismissBtn.addEventListener('click', function() {
      localStorage.setItem('tablo-install-dismissed', 'true');
      hideInstallBanner();
    });
  }

  // ========== APP LAUNCHED FROM HOME SCREEN ==========
  window.addEventListener('appinstalled', function() {
    console.log('PWA installed successfully');
    deferredPrompt = null;
    hideInstallBanner();
  });

})();