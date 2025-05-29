"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { InfoPopup } from "@/components/ui/info-popup"
import type { SpectrogramSettings } from "@/types/spectrogram"

interface FFTSettingsProps {
  settings: SpectrogramSettings
  onSettingsChange: (settings: SpectrogramSettings) => void
  onRegenerate: () => void
}

export function FFTSettings({ settings, onSettingsChange, onRegenerate }: FFTSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-medium text-gray-900">FFT Configuration</h3>
        <InfoPopup title="FFT Settings Guide">
          <div>
            <strong>FFT Size:</strong> Higher values provide better frequency resolution but lower time resolution.
          </div>
          <div>
            <strong>Window Function:</strong> Reduces spectral leakage. Hann window is recommended for most
            applications.
          </div>
          <div>
            <strong>dB Range:</strong> Controls the display scale only - does not modify the audio data. Wider ranges
            show more detail in quiet signals.
          </div>
        </InfoPopup>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">FFT Size</Label>
        <Select
          value={settings.fftSize.toString()}
          onValueChange={(value) => onSettingsChange({ ...settings, fftSize: Number.parseInt(value) })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="512">512 (High time resolution)</SelectItem>
            <SelectItem value="1024">1024 (Balanced)</SelectItem>
            <SelectItem value="2048">2048 (Recommended)</SelectItem>
            <SelectItem value="4096">4096 (High frequency resolution)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Window Function</Label>
        <Select
          value={settings.windowFunction}
          onValueChange={(value) => onSettingsChange({ ...settings, windowFunction: value })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hann">Hann (Recommended)</SelectItem>
            <SelectItem value="hamming">Hamming</SelectItem>
            <SelectItem value="rectangular">Rectangular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">
          dB Display Range: {settings.minDb} to {settings.maxDb} dB
          {settings.minDb >= settings.maxDb && (
            <span className="text-red-500 text-xs ml-2">(Invalid range - min should be less than max)</span>
          )}
        </Label>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs text-gray-600">Minimum dB (dark areas)</Label>
            <Slider
              value={[settings.minDb]}
              onValueChange={([value]) => {
                // Ensure min is always less than max
                const newMinDb = Math.min(value, settings.maxDb - 1)
                onSettingsChange({ ...settings, minDb: newMinDb })
              }}
              min={-200}
              max={20}
              step={5}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Maximum dB (bright areas)</Label>
            <Slider
              value={[settings.maxDb]}
              onValueChange={([value]) => {
                // Ensure max is always greater than min
                const newMaxDb = Math.max(value, settings.minDb + 1)
                onSettingsChange({ ...settings, maxDb: newMaxDb })
              }}
              min={-200}
              max={20}
              step={5}
              className="mt-1"
            />
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          <div>Range: -200dB to +20dB</div>
          <div>Typical ranges: Speech (-80 to 0dB), Music (-100 to 0dB), Weak signals (-150 to -50dB)</div>
        </div>
        {settings.minDb >= settings.maxDb && (
          <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
            Warning: Minimum dB value should be less than maximum dB value for proper display.
          </div>
        )}
      </div>

      <Button onClick={onRegenerate} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        Regenerate Spectrogram
      </Button>
    </div>
  )
}
