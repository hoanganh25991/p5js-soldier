self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open("static-cache").then(function (cache) {
      const filesToCache = [
        // Core HTML and config files
        "index.html",
        "config.js",
        
        // Config directory files
        "config/enemies.js",
        "config/skills.js",
        "config/world.js",
        
        // Core JavaScript files
        "core/environment.js",
        "core/gameState.js",
        "core/progression.js",
        "core/sketch.js",
        "core/skills.js",
        "core/utils.js",
        
        // Core UI files
        "core/ui/cooldownPopup.js",
        "core/ui/gameOverScreen.js",
        "core/ui/menuUI.js",
        "core/ui/pauseMenu.js",
        "core/ui/statusBoard.js",
        "core/ui/uiUtils.js",
        
        // Core managers
        "core/managers/bossManager.js",
        "core/managers/cameraManager.js",
        "core/managers/collisionManager.js",
        "core/managers/enemyManager.js",
        "core/managers/entityManager.js",
        "core/managers/environmentManager.js",
        "core/managers/gameManager.js",
        "core/managers/gpuManager.js",
        "core/managers/particleManager.js",
        "core/managers/performanceManager.js",
        "core/managers/soundManager.js",
        
        // Core environment
        "core/environment/environmentEffects.js",
        
        // Core entities
        "core/entities/airstrike.js",
        "core/entities/boss.js",
        "core/entities/bullet.js",
        "core/entities/clone.js",
        "core/entities/enemy.js",
        "core/entities/fireSkill.js",
        "core/entities/gameBoyAdvanced.js",
        "core/entities/gameCharacter.js",
        "core/entities/gasLighter.js",
        "core/entities/healthBar.js",
        "core/entities/laser.js",
        "core/entities/player.js",
        "core/entities/powerUp.js",
        "core/entities/projectile.js",
        "core/entities/tower.js",
        "core/entities/turret.js",
        "core/entities/wave.js",
        
        // Core entity characters
        "core/entities/characters/Character.js",
        "core/entities/characters/Hero.js",
        "core/entities/characters/Mario.js",
        "core/entities/characters/Megaman.js",
        "core/entities/characters/Songoku.js",
        "core/entities/characters/Tank.js",
        "core/entities/characters/index.js",
        
        // Core controls
        "core/controls/controlsInterface.js",
        "core/controls/keyboardControls.js",
        "core/controls/mouseControls.js",
        "core/controls/skillHandlers.js",
        "core/controls/touchControls.js",
        
        // PWA resources
        "pwa/p5.min.js",
        "pwa/p5.sound.min.js",
        "manifest.json",
        "favicon.ico",
        
        // Sound files
        "sounds/single-shot.mp3",
        "sounds/woosh.mp3"
      ];

      // Cache what we can, but don't fail the install if some files can't be cached
      return Promise.all(
        filesToCache.map((file) =>
          fetch(new Request(file, { cache: 'no-cache' }))
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch ${file}: ${response.status} ${response.statusText}`);
              }
              return cache.put(file, response);
            })
            .catch((error) => {
              console.error(`Failed to cache ${file}:`, error);
              // Continue with installation even if some files fail to cache
            })
        )
      );
    })
  );
});

self.addEventListener("fetch", function (event) {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Try to serve from cache first, then fall back to network
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Return cached response if found
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).then(function(networkResponse) {
        // Don't cache non-successful responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Clone the response since it can only be consumed once
        var responseToCache = networkResponse.clone();
        
        // Add the new resource to cache for future requests
        caches.open('static-cache').then(function(cache) {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      });
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

// Skip waiting during installation to activate immediately
self.skipWaiting();

self.addEventListener("activate", (event) => {
  // Claim clients so the service worker starts controlling current pages
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches if needed
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            // You can add logic here to determine which caches to delete
            // For now, we'll keep the current cache
            return cacheName !== 'static-cache';
          }).map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      })
    ])
  );
});
