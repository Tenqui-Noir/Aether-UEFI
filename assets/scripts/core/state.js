export const STORAGE_KEY = "aether-uefi-state";

export function getDefaultState(bootItems) {
  return {
    toggles: {},
    secureBootOption: "microsoft-third-party",
    lastSecureBootOption: "microsoft-third-party",
    uefiPassword: "",
    bootDeleted: [],
    bootOrder: bootItems.map((item) => item.dataset.bootId),
    bootChecked: bootItems.reduce((result, item) => {
      const check = item.querySelector(".boot-check");
      result[item.dataset.bootId] = Boolean(check?.classList.contains("checked"));
      return result;
    }, {}),
    bootHighlight: bootItems[0]?.dataset.bootId || null,
    dateTimeOffsetMs: 0
  };
}

export function getSecureBootSummaryText(optionKey) {
  const labels = {
    "microsoft-only": "安全启动已启用，使用 Microsoft 密钥集配置",
    "microsoft-third-party": "安全启动已启用，使用 Microsoft 和第三方 CA 密钥集配置",
    disabled: "安全启动已关闭"
  };

  return labels[optionKey] || labels["microsoft-third-party"];
}
