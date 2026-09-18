/**
 * Guards a known transient Vue core race (vuejs/core#8146, open):
 *
 *   TypeError: can't access property "emitsOptions", component is null
 *
 * During a component update, `shouldUpdateComponent` can patch a vnode whose
 * `.component` instance is already null (teleport/popover content toggling or
 * async-component races). It is intermittent and non-fatal — Vue recovers and
 * the app keeps working — but it surfaces as an "Unhandled error during
 * execution of component update" warn plus an uncaught promise rejection.
 *
 * Nuxt unregisters `app.config.errorHandler` once suspense resolves, which is
 * exactly when these post-hydration races fire. This plugin keeps a persistent
 * handler installed that swallows only that signature and logs everything else
 * normally without touching Nuxt's error state.
 */
const TRANSIENT_VUE_RACE = /emitsOptions/;

function isTransientVueRace(error: unknown): boolean {
  return (
    error instanceof TypeError && TRANSIENT_VUE_RACE.test(error.message ?? "")
  );
}

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return;

  const vueApp = nuxtApp.vueApp;

  function installPersistentHandler() {
    vueApp.config.errorHandler = (error, instance, info) => {
      if (isTransientVueRace(error)) {
        const origin = instance?.$el
          ? String(instance.$el.tagName ?? instance.$el.nodeName ?? "?")
          : "?";
        console.debug(
          `[vue] swallowed transient emitsOptions race (${origin} / ${info}):`,
          error.message,
        );
        return;
      }
      console.error("[vue] unhandled error:", error, { instance, info });
    };
  }

  // Plugins run before mount; Nuxt's own handler is still active until
  // suspense resolves, so this covers the hydration window too.
  installPersistentHandler();

  // Nuxt clears config.errorHandler on app:suspense:resolve (entry.js); our
  // hook registered later runs after that clear, so re-install immediately.
  nuxtApp.hook("app:suspense:resolve", installPersistentHandler);

  // Scheduler-path rethrows (no component instance) bypass the error handler;
  // keep them from becoming noisy uncaught rejections.
  window.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    if (isTransientVueRace(reason)) {
      event.preventDefault();
      console.debug("[vue] swallowed transient emitsOptions rejection");
    }
  });
});
