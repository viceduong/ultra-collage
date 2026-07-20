import { Type } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useEditor } from '@/state/store'

/** Add text layers to the canvas. */
export function ElementsPanel() {
  const addText = useEditor((s) => s.addText)

  return (
    <div>
      <div className="panel-section">
        <span className="panel-label">Text</span>
        <Button variant="secondary" size="md" className="w-full" onClick={() => addText()}>
          <Type className="h-4 w-4" /> Add text
        </Button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => addText({ text: 'Heading', fontSize: 96, fontStyle: 'bold' })}>
            Heading
          </Button>
          <Button variant="outline" size="sm" onClick={() => addText({ text: 'Subtitle', fontSize: 48, fontStyle: 'normal' })}>
            Subtitle
          </Button>
        </div>
      </div>
    </div>
  )
}
