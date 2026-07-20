import { Slider } from '@/components/ui/Slider'
import { useEditor } from '@/state/store'

/** Spacing / padding / corner-radius controls for the grid. */
export function StylePanel() {
  const style = useEditor((s) => s.doc.style)
  const setStyle = useEditor((s) => s.setStyle)

  return (
    <div className="panel-section space-y-4">
      <span className="panel-label">Layout style</span>
      <Slider label="Spacing" min={0} max={80} value={style.spacing} unit="px" onChange={(spacing) => setStyle({ spacing })} />
      <Slider label="Outer margin" min={0} max={120} value={style.outerPadding} unit="px" onChange={(outerPadding) => setStyle({ outerPadding })} />
      <Slider label="Corner radius" min={0} max={120} value={style.cornerRadius} unit="px" onChange={(cornerRadius) => setStyle({ cornerRadius })} />
    </div>
  )
}
