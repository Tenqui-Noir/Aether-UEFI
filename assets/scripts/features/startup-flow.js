export function createStartupFlow({
  authGateLoader,
  authGateLoaderFrames,
  startAuthGateLoaderAnimation,
  stopAuthGateLoaderAnimation,
  preUefiScreen,
  preUefiMainView,
  devicePageView,
  troubleshootPageView,
  startupSettingsPageView,
  commandPromptPageView,
  systemImageRecoveryPageView,
  syncPreUefiSelection,
  getInitialPreUefiSelection,
  getCurrentPreUefiView,
  setCurrentPreUefiView
}) {
  let pendingPreUefiBootTimers = [];

  function queueBootTimer(callback, delay) {
    const timerId = window.setTimeout(() => {
      pendingPreUefiBootTimers = pendingPreUefiBootTimers.filter((id) => id !== timerId);
      callback();
    }, delay);
    pendingPreUefiBootTimers.push(timerId);
    return timerId;
  }

  function clearPendingPreUefiBoot() {
    pendingPreUefiBootTimers.forEach((timerId) => window.clearTimeout(timerId));
    pendingPreUefiBootTimers = [];
    stopAuthGateLoaderAnimation?.();
  }

  function showPreUefiScreen() {
    const waitAppearDelay = 1000;
    const loaderAppearDelay = 1000;
    const waitHoldDelay = 3000 + Math.floor(Math.random() * 4001);
    const authFadeDuration = 300;
    const blackHoldDelay = 300;
    const preUefiFadeDuration = 300;
    const menuDelay = 1000;

    clearPendingPreUefiBoot();
    setCurrentPreUefiView("main");
    preUefiMainView?.classList.remove("is-active", "is-fading-in", "is-fading-out", "is-prep");
    devicePageView?.classList.remove("is-active", "is-fading-in", "is-fading-out", "is-prep");
    troubleshootPageView?.classList.remove("is-active", "is-fading-in", "is-fading-out", "is-prep");
    startupSettingsPageView?.classList.remove("is-active", "is-fading-in", "is-fading-out", "is-prep");
    commandPromptPageView?.classList.remove("is-active", "is-fading-in", "is-fading-out", "is-prep");
    systemImageRecoveryPageView?.classList.remove("is-active", "is-fading-in", "is-fading-out", "is-prep");
    document.body.classList.remove(
      "auth-gate-show-wait",
      "auth-gate-show-loader",
      "auth-gate-fading-out",
      "auth-gate-blackhold",
      "pre-uefi-active",
      "pre-uefi-fading-in"
    );

    queueBootTimer(() => {
      document.body.classList.add("auth-gate-show-wait");

      queueBootTimer(() => {
        if (authGateLoaderFrames.length > 0 && authGateLoader) {
          authGateLoader.textContent = authGateLoaderFrames[0];
        }
        startAuthGateLoaderAnimation?.();
        document.body.classList.add("auth-gate-show-loader");

        queueBootTimer(() => {
          document.body.classList.add("auth-gate-fading-out");

          queueBootTimer(() => {
            document.body.classList.remove("auth-gate-show-wait");
            document.body.classList.remove("auth-gate-show-loader");
            stopAuthGateLoaderAnimation?.();
            document.body.classList.remove("auth-gate");
            document.body.classList.remove("auth-gate-fading-out");
            document.body.classList.add("auth-gate-blackhold");

            queueBootTimer(() => {
              document.body.classList.remove("auth-gate-blackhold");
              document.body.classList.add("pre-uefi-active");

              window.requestAnimationFrame(() => {
                void preUefiScreen?.offsetWidth;
                document.body.classList.add("pre-uefi-fading-in");

                queueBootTimer(() => {
                  queueBootTimer(() => {
                    preUefiMainView?.classList.add("is-prep");
                    syncPreUefiSelection(getInitialPreUefiSelection?.("main") ?? 0);

                    window.requestAnimationFrame(() => {
                      void preUefiMainView?.offsetWidth;
                      preUefiMainView?.classList.remove("is-prep");
                      preUefiMainView?.classList.add("is-fading-in");

                      queueBootTimer(() => {
                        preUefiMainView?.classList.remove("is-fading-in");
                        preUefiMainView?.classList.add("is-active");
                      }, preUefiFadeDuration);
                    });
                  }, menuDelay);
                }, preUefiFadeDuration);
              });
            }, blackHoldDelay);
          }, authFadeDuration);
        }, waitHoldDelay);
      }, loaderAppearDelay);
    }, waitAppearDelay);
  }

  function getCurrentViewElement() {
    const currentView = getCurrentPreUefiView();
    if (currentView === "device") {
      return devicePageView;
    }
    if (currentView === "troubleshoot") {
      return troubleshootPageView;
    }
    if (currentView === "startup-settings") {
      return startupSettingsPageView;
    }
    if (currentView === "command-prompt") {
      return commandPromptPageView;
    }
    if (currentView === "system-image-recovery") {
      return systemImageRecoveryPageView;
    }
    return preUefiMainView;
  }

  function continueToUefiFromPreScreen({ lockInteraction, startAuthGate, openAuthPasswordDialog, hasPassword }) {
    const currentViewElement = getCurrentViewElement();
    lockInteraction(3000);
    currentViewElement?.classList.remove("is-active", "is-fading-in");
    currentViewElement?.classList.add("is-fading-out");
    document.body.classList.add("pre-uefi-fading-out");

    window.setTimeout(() => {
      currentViewElement?.classList.remove("is-fading-out");
      document.body.classList.remove("pre-uefi-active", "pre-uefi-fading-in", "pre-uefi-fading-out");
      document.body.classList.add("auth-gate-blackhold");

      window.setTimeout(() => {
        document.body.classList.remove("auth-gate-blackhold");
        startAuthGate();

        window.setTimeout(() => {
          document.body.classList.remove("auth-gate");
          document.body.classList.add("auth-gate-blackhold");

          if (hasPassword()) {
            openAuthPasswordDialog(false);
            return;
          }

          finishAuthGateRevealFast();
        }, 400);
      }, 2000);
    }, 200);
  }

  function switchPreUefiView(nextView, { lockInteraction }) {
    const currentViewElement = getCurrentViewElement();
    const nextViewElement =
      nextView === "device"
        ? devicePageView
        : nextView === "troubleshoot"
          ? troubleshootPageView
          : nextView === "startup-settings"
            ? startupSettingsPageView
            : nextView === "command-prompt"
              ? commandPromptPageView
              : nextView === "system-image-recovery"
                ? systemImageRecoveryPageView
          : preUefiMainView;
    if (!currentViewElement || !nextViewElement || currentViewElement === nextViewElement) {
      return;
    }

    lockInteraction(420);
    currentViewElement.classList.remove("is-active", "is-fading-in");
    currentViewElement.classList.add("is-fading-out");

    window.setTimeout(() => {
      currentViewElement.classList.remove("is-fading-out");
      nextViewElement.classList.add("is-prep");
      setCurrentPreUefiView(nextView);
      syncPreUefiSelection(getInitialPreUefiSelection?.(nextView) ?? 0);

      window.requestAnimationFrame(() => {
        void nextViewElement.offsetWidth;
        nextViewElement.classList.remove("is-prep");
        nextViewElement.classList.add("is-fading-in");

        window.setTimeout(() => {
          nextViewElement.classList.remove("is-fading-in");
          nextViewElement.classList.add("is-active");
        }, 200);
      });
    }, 200);
  }

  function restartIntoUefi({
    lockInteraction,
    hidePreUefiScreen,
    startAuthGate,
    finishAuthGateReveal,
    onBeforeRestart
  }) {
    const isInsidePreUefi = document.body.classList.contains("pre-uefi-active");
    const currentViewElement = getCurrentViewElement();

    onBeforeRestart();

    const beginBlackHold = () => {
      hidePreUefiScreen();
      document.body.classList.remove("auth-gate");
      document.body.classList.remove("auth-gate-reveal", "auth-gate-reveal-fast");
      document.body.classList.add("auth-gate-blackhold");

      window.setTimeout(() => {
        document.body.classList.remove("auth-gate-blackhold");
        startAuthGate();
        finishAuthGateReveal();
      }, 2000);
    };

    if (isInsidePreUefi) {
      lockInteraction(2200);
      currentViewElement?.classList.remove("is-active", "is-fading-in");
      currentViewElement?.classList.add("is-fading-out");
      document.body.classList.add("pre-uefi-fading-out");

      window.setTimeout(() => {
        currentViewElement?.classList.remove("is-fading-out");
        document.body.classList.remove("pre-uefi-fading-out");
        beginBlackHold();
      }, 200);
      return;
    }

    beginBlackHold();
  }

  function hidePreUefiScreen() {
    stopAuthGateLoaderAnimation?.();
    document.body.classList.remove("pre-uefi-active");
    document.body.classList.remove("pre-uefi-fading-in");
    document.body.classList.remove("pre-uefi-fading-out");
    document.body.classList.remove(
      "auth-gate-show-wait",
      "auth-gate-show-loader",
      "auth-gate-fading-out",
      "auth-gate-blackhold"
    );
  }

  function getVisiblePreUefiControls() {
    if (getCurrentPreUefiView() === "device") {
      return Array.from(document.querySelectorAll("#devicePageView .pre-uefi-interactive"));
    }
    if (getCurrentPreUefiView() === "troubleshoot") {
      return Array.from(document.querySelectorAll("#troubleshootPageView .troubleshoot-page-card"));
    }
    if (getCurrentPreUefiView() === "startup-settings") {
      return Array.from(document.querySelectorAll("#startupSettingsPageView .startup-settings-restart"));
    }
    if (getCurrentPreUefiView() === "command-prompt") {
      return Array.from(document.querySelectorAll("#commandPromptPageView .startup-settings-restart"));
    }
    if (getCurrentPreUefiView() === "system-image-recovery") {
      return Array.from(document.querySelectorAll("#systemImageRecoveryPageView .startup-settings-restart"));
    }
    return Array.from(document.querySelectorAll("#preUefiMainView .pre-uefi-interactive"));
  }

  function startAuthGate() {
    stopAuthGateLoaderAnimation?.();
    document.body.classList.add("auth-gate");
    document.body.classList.remove(
      "auth-gate-reveal",
      "auth-gate-reveal-fast",
      "auth-gate-show-wait",
      "auth-gate-show-loader",
      "auth-gate-fading-out",
      "auth-gate-blackhold",
      "pre-uefi-active",
      "pre-uefi-fading-in"
    );
  }

  function finishAuthGateReveal() {
    showPreUefiScreen();
  }

  function finishAuthGateRevealFast() {
    document.body.classList.remove("auth-gate");
    document.body.classList.remove("auth-gate-blackhold");
    hidePreUefiScreen();
    document.body.classList.add("auth-gate-reveal-fast");

    window.setTimeout(() => {
      document.body.classList.remove("auth-gate-reveal-fast");
    }, 90);
  }

  return {
    clearPendingPreUefiBoot,
    continueToUefiFromPreScreen,
    finishAuthGateReveal,
    finishAuthGateRevealFast,
    getVisiblePreUefiControls,
    hidePreUefiScreen,
    restartIntoUefi,
    showPreUefiScreen,
    startAuthGate,
    switchPreUefiView
  };
}
