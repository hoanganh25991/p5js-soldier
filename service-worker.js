self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open("static-cache").then(function (cache) {
      const filesToCache = [
        // Core HTML and config files
        "index.html",
        "config.js",
        
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
        // Removed problematic ES module: core/entities/wave.js
        
        // Core entity characters
        "core/entities/characters/Character.js",
        "core/entities/characters/Hero.js",
        "core/entities/characters/Mario.js",
        "core/entities/characters/Megaman.js",
        "core/entities/characters/Songoku.js",
        "core/entities/characters/Tank.js",
        "core/entities/characters/index.js",
        
        // Core controls
        "core/controls/keyboardControls.js",
        "core/controls/mouseControls.js",
        "core/controls/touchControls.js",
        
        // PWA resources
        "pwa/p5.min.js",
        "pwa/p5.sound.min.js",
        "pwa/manifest.json",
        "favicon.ico"
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

  // Handle module requests differently
  if (event.request.url.endsWith('.js')) {
    const requestURL = new URL(event.request.url);
    const filePath = requestURL.pathname;
    
    // Check if this is likely an ES module (like wave.js)
    if (filePath.includes('/entities/') || filePath.includes('/characters/')) {
      // For ES modules, we'll use a network-first strategy
      event.respondWith(
        fetch(event.request)
          .catch(function() {
            return caches.match(event.request);
          })
      );
      return;
    }
  }

  // For all other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request)
          .then(function(fetchResponse) {
            // Don't cache opaque responses (CORS issues)
            if (fetchResponse.type === 'opaque') {
              return fetchResponse;
            }
            
            // Cache successful responses for future use
            return caches.open('static-cache')
              .then(function(cache) {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
          });
      })
      .catch(function(error) {
        console.error('Fetch error:', error);
        // You could return a custom offline page here
      })
  );
});

self.addEventListener("message", function (event) {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

// Skip waiting during installation to activate immediately
// (removed duplicate install listener)
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
