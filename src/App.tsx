import { AppView } from "@/components/app-view"
import { usePedroVisualizer } from "@/hooks/use-pedro-visualizer"

export function App() {
  return <AppView {...usePedroVisualizer()} />
}

export default App
