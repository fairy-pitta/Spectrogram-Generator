"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { InfoPopup } from "@/components/ui/info-popup"
import { Edit3 } from "lucide-react"
import { useState } from "react"
import type { Annotation } from "@/types/spectrogram"

interface AnnotationSettingsProps {
  annotations: Annotation[]
  onAnnotationsChange: (annotations: Annotation[]) => void
  selectedAnnotation: string | null
  onSelectedAnnotationChange: (id: string | null) => void
}

export function AnnotationSettings({
  annotations,
  onAnnotationsChange,
  selectedAnnotation,
  onSelectedAnnotationChange,
}: AnnotationSettingsProps) {
  const [defaultText, setDefaultText] = useState("Annotation")
  const [defaultColor, setDefaultColor] = useState("#ef4444")
  const [defaultFontSize, setDefaultFontSize] = useState(14)

  const selectedAnnotationData = annotations.find((a) => a.id === selectedAnnotation)

  const updateSelectedAnnotation = (updates: Partial<Annotation>) => {
    if (!selectedAnnotation) return

    onAnnotationsChange(
      annotations.map((annotation) =>
        annotation.id === selectedAnnotation ? { ...annotation, ...updates } : annotation,
      ),
    )
  }

  const deleteAnnotation = (id: string) => {
    onAnnotationsChange(annotations.filter((a) => a.id !== id))
    if (selectedAnnotation === id) {
      onSelectedAnnotationChange(null)
    }
  }

  // Expose defaults for use in canvas
  ;(window as any).annotationDefaults = {
    text: defaultText,
    color: defaultColor,
    fontSize: defaultFontSize,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Edit3 className="w-4 h-4 text-gray-600" />
        <h3 className="font-medium text-gray-900">Annotations</h3>
        <InfoPopup title="Annotation Guide">
          <div>
            <strong>Default Settings:</strong> Set the default text, color, and size for new annotations
          </div>
          <div>
            <strong>Text Annotations:</strong> Click anywhere on the spectrogram to add text labels
          </div>
          <div>
            <strong>Shapes:</strong> Draw lines, rectangles, and arrows by clicking start and end points
          </div>
          <div>
            <strong>Editing:</strong> Select annotations to modify their properties in real-time
          </div>
          <div>
            <strong>Colors:</strong> Use high contrast colors for better visibility in publications
          </div>
        </InfoPopup>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Default Settings</h4>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-700">Default Text</Label>
            <Input
              value={defaultText}
              onChange={(e) => setDefaultText(e.target.value)}
              placeholder="Enter default annotation text"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Default Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={defaultColor}
                onChange={(e) => setDefaultColor(e.target.value)}
                className="w-16 h-10 p-1 border"
              />
              <Input
                type="text"
                value={defaultColor}
                onChange={(e) => setDefaultColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Default Font Size: {defaultFontSize}px</Label>
            <Slider
              value={[defaultFontSize]}
              onValueChange={([value]) => setDefaultFontSize(value)}
              min={8}
              max={32}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {selectedAnnotationData && (
        <Card className="p-3 border border-blue-200 bg-blue-50">
          <h4 className="font-medium text-blue-900 mb-3">Edit Selected Annotation</h4>

          <div className="space-y-3">
            {selectedAnnotationData.type === "text" && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Text</Label>
                <Textarea
                  value={selectedAnnotationData.text || ""}
                  onChange={(e) => updateSelectedAnnotation({ text: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-gray-700">Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={selectedAnnotationData.color}
                  onChange={(e) => updateSelectedAnnotation({ color: e.target.value })}
                  className="w-16 h-10 p-1 border"
                />
                <Input
                  type="text"
                  value={selectedAnnotationData.color}
                  onChange={(e) => updateSelectedAnnotation({ color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            {selectedAnnotationData.type === "text" && (
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Font Size: {selectedAnnotationData.fontSize || 14}px
                </Label>
                <Slider
                  value={[selectedAnnotationData.fontSize || 14]}
                  onValueChange={([value]) => updateSelectedAnnotation({ fontSize: value })}
                  min={8}
                  max={32}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => onSelectedAnnotationChange(null)} className="flex-1">
                Deselect
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteAnnotation(selectedAnnotationData.id)}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Annotations ({annotations.length})</h4>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                selectedAnnotation === annotation.id
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
              onClick={() => onSelectedAnnotationChange(annotation.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-3 h-3 rounded border border-gray-300" style={{ backgroundColor: annotation.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {annotation.text || `(${Math.round(annotation.x)}, ${Math.round(annotation.y)})`}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteAnnotation(annotation.id)
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
              >
                ×
              </Button>
            </div>
          ))}
          {annotations.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No annotations yet. Use the tools above to add some.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
