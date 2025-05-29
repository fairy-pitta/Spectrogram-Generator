"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { InfoPopup } from "@/components/ui/info-popup"
import { Palette } from "lucide-react"
import type { SpectrogramSettings } from "@/types/spectrogram"

interface StyleSettingsProps {
  settings: SpectrogramSettings
  onSettingsChange: (settings: SpectrogramSettings) => void
}

export function StyleSettings({ settings, onSettingsChange }: StyleSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-4 h-4 text-gray-600" />
        <h3 className="font-medium text-gray-900">Display Style</h3>
        <InfoPopup title="Style Settings Guide">
          <div>
            <strong>Academic Style:</strong> Enables professional formatting with proper axes, labels, and grid
          </div>
          <div>
            <strong>Colormap:</strong> Grayscale is preferred for publications, while viridis/plasma offer better
            perceptual uniformity
          </div>
          <div>
            <strong>Grid & Axes:</strong> Essential for scientific presentations and measurements
          </div>
        </InfoPopup>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">Academic paper style</Label>
        <Switch
          checked={settings.academicStyle}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, academicStyle: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">Show grid</Label>
        <Switch
          checked={settings.showGrid}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, showGrid: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">Show axes</Label>
        <Switch
          checked={settings.showAxes}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, showAxes: checked })}
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Colormap</Label>
        <Select value={settings.colormap} onValueChange={(value) => onSettingsChange({ ...settings, colormap: value })}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grayscale">Grayscale (Academic)</SelectItem>
            <SelectItem value="viridis">Viridis</SelectItem>
            <SelectItem value="plasma">Plasma</SelectItem>
            <SelectItem value="inferno">Inferno</SelectItem>
            <SelectItem value="magma">Magma</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-medium text-gray-700">Time Unit</Label>
          <Select
            value={settings.timeUnit}
            onValueChange={(value) => onSettingsChange({ ...settings, timeUnit: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s">Seconds (s)</SelectItem>
              <SelectItem value="ms">Milliseconds (ms)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700">Frequency Unit</Label>
          <Select
            value={settings.freqUnit}
            onValueChange={(value) => onSettingsChange({ ...settings, freqUnit: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kHz">kHz</SelectItem>
              <SelectItem value="Hz">Hz</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
