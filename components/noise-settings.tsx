"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { InfoPopup } from "@/components/ui/info-popup"
import { Volume2 } from "lucide-react"
import type { SpectrogramSettings } from "@/types/spectrogram"

interface NoiseSettingsProps {
  settings: SpectrogramSettings
  onSettingsChange: (settings: SpectrogramSettings) => void
}

export function NoiseSettings({ settings, onSettingsChange }: NoiseSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-4 h-4 text-gray-600" />
        <h3 className="font-medium text-gray-900">Noise Reduction</h3>
        <InfoPopup title="Noise Reduction Guide">
          <div>
            <strong>dB Range vs Noise Reduction:</strong>
            <br />• dB Range: Display scale only (no data modification)
            <br />• Noise Reduction: Actually processes and filters the data
          </div>
          <div>
            <strong>For bird song analysis:</strong>
            <br />
            1. Enable noise reduction
            <br />
            2. Set threshold to -60dB
            <br />
            3. Enable signal enhancement
            <br />
            4. Set enhancement to +10dB
          </div>
        </InfoPopup>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">Enable noise reduction</Label>
        <Switch
          checked={settings.noiseReduction}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, noiseReduction: checked })}
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Noise threshold: {settings.noiseThreshold} dB</Label>
        <Slider
          value={[settings.noiseThreshold]}
          onValueChange={([value]) => onSettingsChange({ ...settings, noiseThreshold: value })}
          min={-100}
          max={-20}
          step={5}
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-1">Signals below this level are removed</p>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">Enable signal enhancement</Label>
        <Switch
          checked={settings.signalEnhancement}
          onCheckedChange={(checked) => onSettingsChange({ ...settings, signalEnhancement: checked })}
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">
          Signal boost: +{((settings.contrastBoost - 1.0) * 10).toFixed(1)} dB
        </Label>
        <Slider
          value={[settings.contrastBoost]}
          onValueChange={([value]) => onSettingsChange({ ...settings, contrastBoost: value })}
          min={1.0}
          max={3.0}
          step={0.1}
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-1">Enhancement for signals above threshold</p>
      </div>
    </div>
  )
}
