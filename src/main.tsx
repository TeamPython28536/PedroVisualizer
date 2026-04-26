import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { registerSW } from "virtual:pwa-register"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

const updateServiceWorker = registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new Event("visualizer:pwa-offline-ready"))
  },
  onNeedRefresh() {
    window.dispatchEvent(new Event("visualizer:pwa-update-ready"))
  },
  onRegisteredSW(_swScriptUrl, registration) {
    if (!registration) {
      return
    }

    const checkForUpdates = () => {
      if (navigator.onLine) {
        void registration.update()
      }
    }

    checkForUpdates()
    window.addEventListener("online", checkForUpdates)
  },
})

window.__visualizerApplyPwaUpdate = updateServiceWorker

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
