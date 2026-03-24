/**
 * SPlay Bridge - WebView ↔ Native App Haberleşme
 * Bu dosya tüm HTML5 oyunlarda ortak kullanılır.
 * 
 * Akış:
 *   Oyun JS → SPlayBridge (native) → AdMob reklam gösterir
 *   Reklam biter → Native → window.SPlay.onRewardedComplete() → Unity'ye sinyal
 */

(function () {
    'use strict';

    // Native bridge mevcut mu? (Android WebView'den addJavascriptInterface ile eklenir)
    const hasNativeBridge = typeof window.SPlayNative !== 'undefined';

    // Rewarded reklam göster
    window.showRewarded = function () {
        if (hasNativeBridge) {
            window.SPlayNative.showRewarded();
        } else {
            console.warn('[SPlay] Native bridge yok, rewarded atlanıyor');
            // Geliştirme/test modunda direkt ödül ver
            window.SPlay.onRewardedComplete('rewarded');
        }
    };

    // Interstitial reklam göster
    window.showInterstitial = function () {
        if (hasNativeBridge) {
            window.SPlayNative.showInterstitial();
        } else {
            console.warn('[SPlay] Native bridge yok, interstitial atlanıyor');
            window.SPlay.onInterstitialComplete('closed');
        }
    };

    // Native app'ten geri çağrılar (callback)
    window.SPlay = {
        // Native reklam bitince bunu çağırır
        // state: 'rewarded' (ödül verildi) | 'closed' (kapatıldı) | 'failed' (hata)
        onRewardedComplete: function (state) {
            if (typeof sendMessageToUnity === 'function') {
                sendMessageToUnity('OnRewardedStateChanged', state);
            }
        },

        onInterstitialComplete: function (state) {
            if (typeof sendMessageToUnity === 'function') {
                sendMessageToUnity('OnInterstitialStateChanged', state);
            }
        },

        // Oyun visibility değişikliği (reklam sırasında oyunu durdur)
        onVisibilityChanged: function (state) {
            if (typeof sendMessageToUnity === 'function') {
                sendMessageToUnity('OnVisibilityStateChanged', state);
            }
        }
    };

    console.log('[SPlay] Bridge yüklendi. Native:', hasNativeBridge);
})();
