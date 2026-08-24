const VERSION = "islamic-app-v7";

const APP_CACHE = VERSION + "-app";

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./service-worker.js",
    "./adhan.mp3",

    // Vue 3
    "https://unpkg.com/vue@3/dist/vue.global.prod.js"
];

/* =========================================
   التثبيت
========================================= */

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(APP_CACHE).then(async cache => {

            for (const url of APP_FILES) {

                try {

                    const request = new Request(url, {
                        mode: url.startsWith("http")
                            ? "no-cors"
                            : "same-origin"
                    });

                    const response = await fetch(request);

                    if (response.ok || response.type === "opaque") {
                        await cache.put(request, response);
                    }

                } catch (error) {

                    console.log(
                        "تعذر حفظ الملف:",
                        url,
                        error
                    );

                }

            }

        }).then(() => self.skipWaiting())

    );

});


/* =========================================
   التفعيل
========================================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys
                    .filter(key => key !== APP_CACHE)
                    .map(key => caches.delete(key))

            );

        }).then(() => self.clients.claim())

    );

});


/* =========================================
   تشغيل التطبيق بدون إنترنت
========================================= */

self.addEventListener("fetch", event => {

    const request = event.request;

    if (request.method !== "GET") return;

    event.respondWith(

        caches.match(request).then(cached => {

            if (cached) {
                return cached;
            }

            return fetch(request)
                .then(response => {

                    /*
                     * نحفظ الملفات المحلية الجديدة
                     */
                    if (
                        response &&
                        response.status === 200 &&
                        response.type === "basic"
                    ) {

                        const copy = response.clone();

                        caches.open(APP_CACHE)
                            .then(cache => {
                                cache.put(request, copy);
                            });

                    }

                    return response;

                })
                .catch(() => {

                    /*
                     * عند عدم وجود الإنترنت
                     */
                    if (
                        request.mode === "navigate" ||
                        request.destination === "document"
                    ) {

                        return caches.match("./index.html");

                    }

                    return new Response(
                        "لا يوجد اتصال بالإنترنت",
                        {
                            status: 503,
                            headers: {
                                "Content-Type":
                                    "text/plain; charset=utf-8"
                            }
                        }
                    );

                });

        })

    );

});