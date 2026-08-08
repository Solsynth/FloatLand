import { existsSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  hooks: {
    "prepare:types"() {
      const dotNuxt = resolve(process.cwd(), ".nuxt")
      const serverTsConfig = resolve(dotNuxt, "tsconfig.server.json")
      if (!existsSync(serverTsConfig)) {
        writeFileSync(serverTsConfig, JSON.stringify({
          compilerOptions: {
            target: "ESNext",
            module: "ESNext",
            moduleResolution: "Bundler",
            strict: true,
            skipLibCheck: true,
            allowJs: true,
            resolveJsonModule: true,
            isolatedModules: true,
            verbatimModuleSyntax: true,
            allowArbitraryExtensions: true,
            noEmit: true,
            lib: ["ESNext", "DOM", "DOM.Iterable", "WebWorker"],
            types: ["node"]
          },
          include: [
            resolve(dotNuxt, "nuxt.d.ts"),
            "../server/**/*"
          ],
          exclude: ["../node_modules", "../dist"]
        }, null, 2))
      }
    }
  },
  modules: [
    "nuxt-lucide-icons",
    "@nuxt/eslint",
    "@pinia/nuxt",
    "@nuxtjs/i18n",
    "@nuxt/fonts",
    "@nuxt/image",
    "nuxt-og-image",
    "nuxt-seo-utils",
    "nuxt-schema-org",
    "@nuxtjs/sitemap",
    "@nuxtjs/robots",
    "vue-sonner/nuxt",
    "nuxt-email-renderer",
  ],
  site: {
    url: "https://solian.app",
  },
  i18n: {
    strategy: "no_prefix",
    defaultLocale: "en",
    locales: [
      { code: "en", language: "en-US", name: "English", file: "en.json" },
      { code: "zh", language: "zh-CN", name: "简体中文", file: "zh-CN.json" },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_locale",
      redirectOn: "root",
      fallbackLocale: "en",
      alwaysRedirect: false,
    },
  },
  fonts: {
    families: [
      {
        name: "Nunito",
        src: "/fonts/Nunito-Regular.woff2",
        weight: 400,
        style: "normal",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-Italic.woff2",
        weight: 400,
        style: "italic",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-Bold.woff2",
        weight: 700,
        style: "normal",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-BoldItalic.woff2",
        weight: 700,
        style: "italic",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-SemiBold.woff2",
        weight: 600,
        style: "normal",
        global: true,
      },
      {
        name: "Nunito",
        src: "/fonts/Nunito-ExtraBold.woff2",
        weight: 800,
        style: "normal",
        global: true,
      },
      {
        name: "Noto Sans SC",
        src: "/fonts/NotoSansSC-Regular.woff2",
        weight: 400,
        style: "normal",
        global: true,
      },
      {
        name: "Noto Sans SC",
        src: "/fonts/NotoSansSC-Bold.woff2",
        weight: 600,
        style: "normal",
        global: true,
      },
      {
        name: "Noto Sans SC",
        src: "/fonts/NotoSansSC-Bold.woff2",
        weight: 700,
        style: "normal",
        global: true,
      },
      {
        name: "Noto Sans SC",
        src: "/fonts/NotoSansSC-Bold.woff2",
        weight: 800,
        style: "normal",
        global: true,
      },
    ],
  },
  css: [
    "~/assets/css/main.css",
    "lightgallery/css/lightgallery.css",
    "lightgallery/css/lg-thumbnail.css",
    "lightgallery/css/lg-video.css",
    "lightgallery/css/lg-zoom.css",
  ],
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  experimental: {
    viewTransition: true,
  },
  image: {
    inject: false,
    quality: 80,
    format: ["webp", "jpg"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      og: 900,
    },
    providers: {
      solian: {
        provider: "ipx",
        options: {
          baseURL: "https://api.solian.app/drive/files",
        },
      },
    },
  },
  ogImage: {
    enabled: true,
    security: {
      renderTimeout: 60000,
    },
  },
  app: {
    head: {
      title: "Solar Network",
      titleTemplate: "%s · Solar Network",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Explore posts, realms, and publishers on Solar Network.",
        },
        { name: "theme-color", content: "#4f46e5" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Solar Network" },
        { property: "og:title", content: "Solar Network" },
        {
          property: "og:description",
          content: "Explore posts, realms, and publishers on Solar Network.",
        },
        { property: "og:image", content: "/og-image.png" },
        { property: "og:url", content: "https://solian.app" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Solar Network" },
        {
          name: "twitter:description",
          content: "Explore posts, realms, and publishers on Solar Network.",
        },
        { name: "twitter:image", content: "/og-image.png" },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap",
        },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  lucide: {
    namePrefix: "icon",
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: "https://api.solian.app",
      fileBaseUrl: "https://api.solian.app/drive/files",
    },
  },
  site: {
    url: "https://solian.app",
    name: "Solar Network",
    description: "Explore posts, realms, and publishers on Solar Network.",
    defaultLocale: "en",
  },
  schemaOrg: {
    identity: {
      type: "Organization",
      name: "Solar Network",
      url: "https://solian.app",
      logo: "https://solian.app/favicon.png",
      sameAs: ["https://github.com/solsynth", "https://twitter.com/solsynth"],
    },
  },
  sitemap: {
    gzip: true,
    exclude: ["/admin/**", "/auth/**", "/api/**", "/compose", "/drive/**", "/tickets/**"],
    defaults: {
      changefreq: "daily",
      priority: 0.7,
    },
  },
  robots: {
    allow: "/",
    disallow: ["/admin", "/auth", "/api", "/compose", "/drive"],
    sitemap: "https://solian.app/sitemap.xml",
  },
  nitro: {
    buildDir: "./.nitro",
    routeRules: {},
    storage: {
      root: {
        driver: "fs",
        readOnly: true,
        base: ".",
      },
      src: {
        driver: "fs",
        readOnly: true,
        base: "app",
      },
      build: {
        driver: "fs",
        base: "./.nuxt",
      },
      cache: {
        driver: "fs",
        base: "./.nuxt/cache",
      },
    },
  },
});
