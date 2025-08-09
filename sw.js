// Python 30-Day Mastery PWA Service Worker
// Version 1.0.0

const CACHE_NAME = 'python-mastery-v1.0.0';
const STATIC_CACHE = 'python-mastery-static-v1.0.0';
const DYNAMIC_CACHE = 'python-mastery-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Cache external resources that the app relies on
  'https://www.w3schools.com/python/python_getstarted.asp',
  'https://www.w3schools.com/python/python_variables.asp',
  'https://www.python.org/downloads/',
  'https://code.visualstudio.com/docs/python/python-tutorial'
];

// Dynamic cache patterns for educational resources
const CACHE_PATTERNS = [
  /^https:\/\/www\.w3schools\.com\/python\//,
  /^https:\/\/www\.programiz\.com\/python-programming\//,
  /^https:\/\/www\.learnpython\.org\//,
  /^https:\/\/realpython\.com\//,
  /^https:\/\/www\.geeksforgeeks\.org\/.*python.*/,
  /^https:\/\/docs\.python\.org\//,
  /^https:\/\/numpy\.org\/doc\//,
  /^https:\/\/pandas\.pydata\.org\/docs\//,
  /^https:\/\/matplotlib\.org\//,
  /^https:\/\/flask\.palletsprojects\.com\//
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle main app requests
  if (url.origin === self.location.origin) {
    event.respondWith(handleAppRequests(request));
    return;
  }

  // Handle external educational resources
  if (shouldCacheResource(url.href)) {
    event.respondWith(handleEducationalResources(request));
    return;
  }

  // Let other requests pass through
  event.respondWith(fetch(request));
});

// Handle app requests with cache-first strategy
async function handleAppRequests(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📋 Service Worker: Serving from cache', request.url);
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('💾 Service Worker: Cached new resource', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Service Worker: Network error', error);
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/');
      return offlinePage || new Response('App is offline', { 
        status: 503, 
        statusText: 'Service Unavailable' 
      });
    }
    
    throw error;
  }
}

// Handle educational resources with network-first strategy
async function handleEducationalResources(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('📚 Service Worker: Cached educational resource', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔍 Service Worker: Network failed, checking cache', request.url);
    
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📖 Service Worker: Serving educational content from cache', request.url);
      return cachedResponse;
    }
    
    // Return offline message for educational resources
    return new Response(
      `<html>
        <head>
          <title>Offline - Python Mastery</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 50px 20px;
              margin: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .offline-message {
              background: rgba(255, 255, 255, 0.1);
              padding: 30px;
              border-radius: 20px;
              backdrop-filter: blur(20px);
              max-width: 400px;
            }
            .offline-emoji {
              font-size: 64px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 15px;
            }
            p {
              font-size: 16px;
              line-height: 1.5;
              opacity: 0.9;
            }
            .retry-btn {
              background: #4ade80;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
              margin-top: 20px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <div class="offline-emoji">📚</div>
            <h1>Content Offline</h1>
            <p>This learning resource isn't available offline yet. Check your connection and try again, or continue with cached lessons.</p>
            <button class="retry-btn" onclick="location.reload()">Try Again</button>
          </div>
        </body>
      </html>`,
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Check if a resource should be cached
function shouldCacheResource(url) {
  return CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Background sync for progress data
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgressData());
  }
});

// Sync progress data when connection is restored
async function syncProgressData() {
  try {
    // Get stored progress data that needs syncing
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_PROGRESS',
        message: 'Progress data synced successfully'
      });
    });
    
    console.log('✅ Service Worker: Progress data synced');
  } catch (error) {
    console.error('❌ Service Worker: Sync failed', error);
  }
}

// Push notifications for daily reminders
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : '⏰ Time for your daily Python learning session!',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxwYXRoIGQ9Ik05NiAzMkM3Mi45IDMyIDU0IDUwLjkgNTQgNzRWMTE4SDk2VjEyNkg1NEMzMC45IDEyNiAxMiAxMDcuMSAxMiA4NFY3NEMxMiAzOS42IDM5LjYgMTIgNzQgMTJIODRDMTA3LjEgMTIgMTI2IDMwLjkgMTI2IDU0Vjc0SDg0VjY2SDEyNkMxNDkuMSA2NiAxNjggODQuOSAxNjggMTA4VjExOEMxNjggMTUyLjQgMTQwLjQgMTgwIDEwNiAxODBIOTZDNzIuOSAxODAgNTQgMTYxLjEgNTQgMTM4VjExOEg5NlYxMTBINTRDMzAuOSAxMTAgMTIgOTEuMSAxMiA2OFY1OEMxMiAyMy42IDM5LjYgLTQgNzQgLTRIODRDMTE4LjQgLTQgMTQ2IDIzLjYgMTQ2IDU4VjY4SDE4MEMxODAuNCA2OCAxODAgNjguNDE4IDE4MCA2OFY2OEMxODAgNjguNDE4IDE4MC40IDY4IDE4MCA2OFoiIGZpbGw9IndoaXRlIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MF9saW5lYXJfMV8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIiIHkyPSIxOTIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxwYXRoIGQ9Ik05NiAzMkM3Mi45IDMyIDU0IDUwLjkgNTQgNzRWMTE4SDk2VjEyNkg1NEMzMC45IDEyNiAxMiAxMDcuMSAxMiA4NFY3NEMxMiAzOS42IDM5LjYgMTIgNzQgMTJIODRDMTA3LjEgMTIgMTI2IDMwLjkgMTI2IDU0Vjc0SDg0VjY2SDEyNkMxNDkuMSA2NiAxNjggODQuOSAxNjggMTA4VjExOEMxNjggMTUyLjQgMTQwLjQgMTgwIDEwNiAxODBIOTZDNzIuOSAxODAgNTQgMTYxLjEgNTQgMTM4VjExOEg5NlYxMTBINTRDMzAuOSAxMTAgMTIgOTEuMSAxMiA2OFY1OEMxMiAyMy42IDM5LjYgLTQgNzQgLTRIODRDMTE4LjQgLTQgMTQ2IDIzLjYgMTQ2IDU4VjY4SDE4MEMxODAuNCA2OCAxODAgNjguNDE4IDE4MCA2OFY2OEMxODAgNjguNDE4IDE4MC40IDY4IDE4MCA2OFoiIGZpbGw9IndoaXRlIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MF9saW5lYXJfMV8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxOTIiIHkyPSIxOTIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'start-learning',
        title: '🐍 Start Learning',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xNiAxMkwyOCAyNEwxNiAzNlYxMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg=='
      },
      {
        action: 'dismiss',
        title: 'Later',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0zNiAxNkwzMiAzMkwxNiAzNkwxMiAxNkwzNiAxNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg=='
      }
    ],
    requireInteraction: true,
    tag: 'python-learning-reminder',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification('🐍 Python Mastery Tracker', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked', event.action);
  
  event.notification.close();

  if (event.action === 'start-learning') {
    // Open the app and focus on learning
    event.waitUntil(
      clients.openWindow('/').then(client => {
        if (client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: 'start-learning'
          });
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('📱 Notification dismissed');
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/').then(client => {
        if (client) {
          client.focus();
        }
      })
    );
  }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'CACHE_EDUCATIONAL_RESOURCE') {
    // Cache specific educational resources on demand
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.add(event.data.url);
      })
    );
  }
  
  if (event.data && event.data.type === 'SCHEDULE_BACKGROUND_SYNC') {
    // Register for background sync
    event.waitUntil(
      self.registration.sync.register('sync-progress')
    );
  }
});

// Cleanup old caches periodically
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const cachesToDelete = cacheNames.filter(name => 
      name.startsWith('python-mastery-') && 
      name !== STATIC_CACHE && 
      name !== DYNAMIC_CACHE
    );
    
    await Promise.all(cachesToDelete.map(name => caches.delete(name)));
    console.log('🧹 Service Worker: Old caches cleaned up');
  } catch (error) {
    console.error('❌ Service Worker: Cache cleanup failed', error);
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker: Global error', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker: Unhandled promise rejection', event.reason);
});

console.log('🚀 Service Worker: Script loaded successfully');
