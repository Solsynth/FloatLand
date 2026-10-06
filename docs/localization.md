# Localization (i18n)

This app uses [`@nuxtjs/i18n`](https://i18n.nuxtjs.org/) to provide multi-language
support. Locale detection is **automatic, prefix-free, and SSR-friendly**: URLs
never contain `/en/` or `/zh/` segments, and the correct language is rendered
on the very first paint.

## How it works

### Detection flow

1. **First request (SSR).** The Nitro server reads the incoming
   `Accept-Language` header, picks the closest match from the configured
   locales, and renders the page in that language. The active locale is
   written to an `i18n_locale` cookie.
2. **Subsequent requests.** The cookie is read first, so the user's previous
   choice (or the originally detected locale) is preserved.
3. **Manual switch.** When the user changes the language via the in-app
   switcher, `setLocale(code)` updates the cookie and triggers a re-render.

The `no_prefix` strategy guarantees no URL changes: `/`, `/realms`,
`/accounts/me/settings/appearance`, etc. all stay the same regardless of
locale.

### Configuration

See `nuxt.config.ts`:

```ts
modules: [..., "@nuxtjs/i18n"],
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
```

- `language` — the BCP-47 tag used to match `Accept-Language` and to set the
  `<html lang>` attribute.
- Messages are loaded on demand: locale JSON files are fetched as separate
  assets and only for the active locale (`@nuxtjs/i18n` v10 removed the `lazy`
  option, lazy loading is always on).
- `alwaysRedirect: false` — once the user manually sets a locale, the app
  honours it instead of re-detecting on every navigation.

## File layout

```
i18n/
└── locales/
    ├── en.json       # English (default)
    └── zh-CN.json    # Simplified Chinese
```

`@nuxtjs/i18n` automatically picks up `i18n/locales/*.json` based on the
`file` field of each locale entry. To add a new language, create the JSON
file and append the locale to `nuxt.config.ts`.

## Translation key conventions

Keys are namespaced by feature:

| Namespace    | Used in                                              |
| ------------ | ---------------------------------------------------- |
| `common`     | Generic strings (loading, load more, no more)        |
| `nav`        | Sidebar links, account dropdown, sign-in CTA         |
| `home`       | `app/pages/index.vue` (SEO, compose, posts list)     |
| `appearance` | `app/pages/accounts/me/settings/appearance.vue`      |

When adding a new feature page, create a new top-level namespace rather than
piling keys into existing ones.

## Using translations

### In `<script setup>`

```ts
const { t } = useI18n();

useSolarSeo({
  title: t("home.seoTitle"),
  description: t("home.seoDescription"),
});
```

### In templates

```vue
<span>{{ t("common.loading") }}</span>
<span>{{ $t("common.loadMore") }}</span>  <!-- $t also works -->
```

### Interpolation

```json
{ "loadFailed": "Failed to load posts: {error}" }
```

```ts
t("home.loadFailed", { error: String(err) });
```

## SEO

`app/composables/useSolarSeo.ts` injects `useI18n()` and sets:

- `<html lang>` from `localeProperties.value.language` (e.g. `en-US`,
  `zh-CN`).
- `<title>`, `og:*`, and `twitter:*` meta tags. Pass already-translated
  strings (`t("home.seoTitle")`) to it from the page component.

Each page must call `useSolarSeo({ title: t(...) })` at the **top level** of
`<script setup>` so it runs during SSR.

## Language switcher

The user-facing switcher lives in
`app/pages/accounts/me/settings/appearance.vue` as the **Language** card.
It iterates over `useI18n().locales` and calls `setLocale(code)` on click.
Selecting a locale:

1. Persists the choice to the `i18n_locale` cookie.
2. Re-renders the UI immediately with the new translations.
3. Has no effect on URLs.

If a switcher is needed elsewhere later, copy the same pattern:

```ts
const { locale, locales, setLocale } = useI18n();
```

## Adding a new locale

1. Create `i18n/locales/<code>.json` with all the keys present in
   `en.json`.
2. Add an entry to `nuxt.config.ts`:
   ```ts
   { code: "ja", language: "ja-JP", name: "日本語", file: "ja.json" }
   ```
3. Restart the dev server. The new locale will appear in the switcher and be
   eligible for `Accept-Language` detection automatically.

## Adding a new translatable page / component

1. Pick (or create) a namespace, e.g. `realms`.
2. Add the keys to **every** locale file. Missing keys fall back to the
   default locale, but it's cleaner to keep them in sync.
3. In the component:
   ```ts
   const { t } = useI18n();
   ```
4. Replace hard-coded strings with `t("namespace.key")` in the template and
   script.
5. For SEO, route titles/descriptions through `useSolarSeo({ title: t(...) })`.

## Verifying detection

```bash
# Force English
curl -s -H "Accept-Language: en-US" http://localhost:3000 | grep '<html'

# Force Chinese — response should contain Chinese strings server-rendered
curl -s -H "Accept-Language: zh-CN" http://localhost:3000 | grep -o '探索' | head -1
```

The `<html lang>` attribute should reflect the detected locale, and the
SSR-rendered HTML should contain the translated copy (no client-side
hydration flash).

## Files of interest

- `nuxt.config.ts` — module config
- `i18n/locales/*.json` — translation strings
- `app/composables/useSolarSeo.ts` — locale-aware `<html lang>` + meta tags
- `app/pages/accounts/me/settings/appearance.vue` — language switcher UI
- `app/pages/index.vue`, `app/components/layout/Sidebar.vue` — example
  consumers
