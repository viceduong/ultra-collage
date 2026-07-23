import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  FlipHorizontal2,
  FlipVertical2,
  Lock,
  RotateCw,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Trash2,
  Unlock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { ColorField } from '@/components/ui/ColorField'
import { useEditor, selectedLayer } from '@/state/store'
import { findCell } from '@/layout/tree'
import type { ShapeLayer } from '@/types'

/** Context-sensitive editor for the current selection (cell or free layer). */
export function InspectorPanel() {
  const selection = useEditor((s) => s.selection)
  if (selection.kind === 'cell') return <CellInspector id={selection.id} />
  if (selection.kind === 'layer') return <LayerInspector />
  return (
    <div className="panel-section">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Select a cell or element on the canvas to edit it. Drag a photo from the left onto a cell, drag
        the dividers to resize, and drag inside a selected photo to reposition it.
      </p>
    </div>
  )
}

function CellInspector({ id }: { id: string }) {
  const cell = useEditor((s) => findCell(s.doc.layout.tree, id))
  const update = useEditor((s) => s.updateCellTransform)
  const splitCellAt = useEditor((s) => s.splitCellAt)
  const removeCellAt = useEditor((s) => s.removeCellAt)
  const clearCell = useEditor((s) => s.clearCell)
  if (!cell) return null
  const t = cell.transform
  const locked = t.locked ?? false

  return (
    <div>
      <div className="panel-section space-y-3">
        <div className="flex items-center justify-between">
          <span className="panel-label !mb-0">Cell</span>
          {cell.assetId && (
            <button
              onClick={() => update(id, { locked: !locked })}
              title={locked ? 'Unlock photo position' : 'Lock photo position'}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                locked ? 'bg-primary text-primary-foreground' : 'bg-elevated text-muted-foreground hover:text-foreground'
              }`}
            >
              {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {locked ? 'Locked' : 'Lock'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => splitCellAt(id, 'h')}>
            <SplitSquareHorizontal className="h-4 w-4" /> Split →
          </Button>
          <Button variant="outline" size="sm" onClick={() => splitCellAt(id, 'v')}>
            <SplitSquareVertical className="h-4 w-4" /> Split ↓
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" disabled={!cell.assetId} onClick={() => clearCell(id)}>
            Clear photo
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeCellAt(id)}>
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        </div>
      </div>

      {cell.assetId && !locked && (
        <div className="panel-section space-y-3">
          <span className="panel-label">Photo position</span>
          <Slider label="Zoom" min={1} max={4} step={0.02} value={t.zoom} unit="×" onChange={(zoom) => update(id, { zoom })} />
          <Slider label="Rotate" min={-180} max={180} value={t.rotation} unit="°" onChange={(rotation) => update(id, { rotation })} />
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => update(id, { flipH: !t.flipH })} title="Flip horizontal">
              <FlipHorizontal2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => update(id, { flipV: !t.flipV })} title="Flip vertical">
              <FlipVertical2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              title="Reset (auto-fit)"
              onClick={() => update(id, { offsetX: 0, offsetY: 0, zoom: 1, rotation: 0, flipH: false, flipV: false })}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Scroll over the photo to zoom · drag to reposition · drag the ⟳ handle to rotate · double-click to auto-fit.
          </p>
        </div>
      )}

      {cell.assetId && locked && (
        <div className="panel-section">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Photo position is locked. Unlock to pan, zoom, or rotate it.
          </p>
        </div>
      )}
    </div>
  )
}

function LayerInspector() {
  const layer = useEditor(selectedLayer)
  const update = useEditor((s) => s.updateLayer)
  const remove = useEditor((s) => s.removeLayer)
  const duplicate = useEditor((s) => s.duplicateLayer)
  const reorder = useEditor((s) => s.reorderLayer)
  if (!layer) return null

  return (
    <div>
      <div className="panel-section space-y-3">
        <div className="flex items-center justify-between">
          <span className="panel-label !mb-0 capitalize">{layer.type}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => reorder(layer.id, 'front')} title="Bring to front">
              <ArrowUpToLine className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => reorder(layer.id, 'back')} title="Send to back">
              <ArrowDownToLine className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => duplicate(layer.id)} title="Duplicate">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => remove(layer.id)} title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Slider label="Opacity" min={0} max={1} step={0.02} value={layer.opacity} onChange={(opacity) => update(layer.id, { opacity })} />
        <Slider label="Rotation" min={-180} max={180} value={layer.rotation} unit="°" onChange={(rotation) => update(layer.id, { rotation })} />
      </div>

      {layer.type === 'text' && (
        <div className="panel-section">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Edit your text layer in the <span className="font-semibold">Text</span> tab.
          </p>
        </div>
      )}
      {layer.type === 'shape' && <ShapeControls layer={layer} />}
    </div>
  )
}

function ShapeControls({ layer }: { layer: ShapeLayer }) {
  const update = useEditor((s) => s.updateLayer)
  return (
    <div className="panel-section space-y-3">
      <span className="panel-label">Shape</span>
      <ColorField label="Fill" value={layer.fill} onChange={(fill) => update(layer.id, { fill })} />
      <ColorField label="Border" value={layer.stroke ?? '#000000'} onChange={(stroke) => update(layer.id, { stroke })} />
      <Slider label="Border width" min={0} max={40} value={layer.strokeWidth} onChange={(strokeWidth) => update(layer.id, { strokeWidth })} />
      {layer.shape === 'rect' && (
        <Slider label="Corner radius" min={0} max={120} value={layer.cornerRadius} onChange={(cornerRadius) => update(layer.id, { cornerRadius })} />
      )}
    </div>
  )
}
