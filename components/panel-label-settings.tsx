"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InfoPopup } from "@/components/ui/info-popup"
import { Tag } from "lucide-react"
import type { SpectrogramSettings } from "@/types/spectrogram"

interface PanelLabelSettingsProps {
  settings: SpectrogramSettings
  onSettingsChange: (settings: SpectrogramSettings) => void
}

export function PanelLabelSettings({ settings, onSettingsChange }: PanelLabelSettingsProps) {
  const handlePositionChange = (position: string) => {
    let x = settings.panelLabelX
    let y = settings.panelLabelY

    // Set default positions based on selection
    if (position !== "custom") {
      switch (position) {
        case "top-left":
          x = 10
          y = 10
          break
        case "top-right":
          x = 900 // Will be adjusted based on canvas width
          y = 10
          break
        case "bottom-left":
          x = 10
          y = 550 // Will be adjusted based on canvas height
          break
        case "bottom-right":
          x = 900
          y = 550
          break
      }
    }

    onSettingsChange({
      ...settings,
      panelLabelPosition: position as any,
      panelLabelX: x,
      panelLabelY: y,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-gray-600" />
        <h3 className="font-medium text-gray-900">Panel Label</h3>
        <InfoPopup title="Panel Label Guide">
          <div>
            <strong>Academic Standard:</strong> Use A, B, C, D... for multi-panel figures in publications
          </div>
          <div>
            <strong>Position:</strong> Top-left is most common in scientific journals. Use custom position for specific
            layout requirements
          </div>
          <div>
            <strong>Color:</strong> Black (#000000) is standard for academic papers. Use high contrast colors for
            visibility
          </div>
          <div>
            <strong>Size:</strong> 16-20px is recommended for publication figures. Adjust based on figure size and
            journal requirements
          </div>
          <div>
            <strong>Best Practice:</strong> Keep labels consistent across all panels in a multi-panel figure
          </div>
        </InfoPopup>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Label Text</Label>
        <Input
          value={settings.panelLabel}
          onChange={(e) => onSettingsChange({ ...settings, panelLabel: e.target.value })}
          placeholder="A, B, C..."
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">Use A, B, C... for multi-panel figures</p>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Label Color</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={settings.panelLabelColor}
            onChange={(e) => onSettingsChange({ ...settings, panelLabelColor: e.target.value })}
            className="w-16 h-10 p-1 border"
          />
          <Input
            type="text"
            value={settings.panelLabelColor}
            onChange={(e) => onSettingsChange({ ...settings, panelLabelColor: e.target.value })}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Black (#000000) is standard for academic papers</p>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Font Size: {settings.panelLabelSize}px</Label>
        <Slider
          value={[settings.panelLabelSize]}
          onValueChange={([value]) => onSettingsChange({ ...settings, panelLabelSize: value })}
          min={8}
          max={48}
          step={1}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Small (8px)</span>
          <span>Recommended: 16-20px</span>
          <span>Large (48px)</span>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Position</Label>
        <Select value={settings.panelLabelPosition} onValueChange={handlePositionChange}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top-left">Top Left (Standard)</SelectItem>
            <SelectItem value="top-right">Top Right</SelectItem>
            <SelectItem value="bottom-left">Bottom Left</SelectItem>
            <SelectItem value="bottom-right">Bottom Right</SelectItem>
            <SelectItem value="custom">Custom Position</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">Top-left is most common in scientific publications</p>
      </div>

      {settings.panelLabelPosition === "custom" && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Custom Position</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600">X Position (pixels)</Label>
              <Input
                type="number"
                value={settings.panelLabelX}
                onChange={(e) => onSettingsChange({ ...settings, panelLabelX: Number.parseInt(e.target.value) || 0 })}
                className="mt-1"
                min="0"
                max="1000"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Y Position (pixels)</Label>
              <Input
                type="number"
                value={settings.panelLabelY}
                onChange={(e) => onSettingsChange({ ...settings, panelLabelY: Number.parseInt(e.target.value) || 0 })}
                className="mt-1"
                min="0"
                max="600"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Coordinates are relative to the canvas. (0,0) is top-left corner.
          </p>
        </div>
      )}
    </div>
  )
}
