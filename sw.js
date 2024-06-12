const CACHE_VESION = "1";
const addResourcesToCache = async (resources) => {
  const cache = await caches.open(`STUDY_CACHE_${CACHE_VESION}`);
  await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      "/",
      "/index.html",
      "/style.css",
      "https://cdn.jsdelivr.net/npm/ant-design-vue@4.2.1/dist/reset.min.css",
      "manifest.webmanifest",
      "https://unpkg.com/vue@3/dist/vue.global.js",
      "https://unpkg.com/dayjs/dayjs.min.js",
      "https://unpkg.com/dayjs/locale/fr.js",
      "https://unpkg.com/dayjs/plugin/relativeTime.js",
      "https://unpkg.com/dayjs/plugin/customParseFormat.js",
      "https://unpkg.com/dayjs/plugin/weekday.js",
      "https://unpkg.com/dayjs/plugin/localeData.js",
      "https://unpkg.com/dayjs/plugin/weekOfYear.js",
      "https://unpkg.com/dayjs/plugin/weekYear.js",
      "https://unpkg.com/dayjs/plugin/advancedFormat.js",
      "https://unpkg.com/dayjs/plugin/quarterOfYear.js",
      "https://cdn.jsdelivr.net/npm/ant-design-vue@4.2.1/dist/antd.min.js",
      "https://unpkg.com/dexie/dist/dexie.js",
      "https://cdn.jsdelivr.net/npm/minidenticons@4.2.1/minidenticons.min.js",
    ])
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(cacheFirst(event.request));
});

self.addEventListener("push", function (event) {
  const payload = event.data ? JSON.parse(event.data.text()) : "no payload";

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/192.png",
      vibrate: [200, 100, 200, 100, 200, 100, 200],
    })
  );
});

const cacheFirst = async (request) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }

  try {
    const responseFromNetwork = await fetch(request);
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    return new Response("Desolé cette ressource n'existe plus", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

const putInCache = async (request, response) => {
  if (
    request.method === "GET" &&
    (request.url.startsWith("http") || request.url.startsWith("https"))
  ) {
    const cache = await caches.open(`STUDY_CACHE_${CACHE_VESION}`);
    await cache.put(request, response);
  }
};
