import { runPricing, switchTab } from "./ui";

document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("runBtn");
  if (runBtn) runBtn.addEventListener("click", runPricing);

  document.querySelectorAll<HTMLElement>(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      runPricing();
    }
  });

  switchTab("greeks");
});