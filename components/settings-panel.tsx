"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FFTSettings } from "./fft-settings"
import { StyleSettings } from "./style-settings"
import { NoiseSettings } from "./noise-settings"
import { AnnotationSettings } from "./annotation-settings"
import { PanelLabelSettings } from "./panel-label-settings"
import type { SpectrogramSettings, Annotation } from "@/types/spectrogram"

interface SettingsPanelProps {
  settings: SpectrogramSettings
  onSettingsChange: (settings: SpectrogramSettings) => void
  onRegenerate: () => void
  annotations: Annotation[]
  onAnnotationsChange: (annotations: Annotation[]) => void
  selectedAnnotation: string | null
  onSelectedAnnotationChange: (id: string | null) => void
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  onRegenerate,
  annotations,
  onAnnotationsChange,
  selectedAnnotation,
  onSelectedAnnotationChange,
}: SettingsPanelProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-white border-b border-gray-100">
        <CardTitle className="text-lg font-semibold text-gray-900">Settings</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="fft" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-50 rounded-none">
            <TabsTrigger value="fft" className="text-xs">
              FFT
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs">
              Style
            </TabsTrigger>
            <TabsTrigger value="label" className="text-xs">
              Label
            </TabsTrigger>
            <TabsTrigger value="noise" className="text-xs">
              Noise
            </TabsTrigger>
            <TabsTrigger value="annotations" className="text-xs">
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fft" className="p-4">
            <FFTSettings settings={settings} onSettingsChange={onSettingsChange} onRegenerate={onRegenerate} />
          </TabsContent>

          <TabsContent value="style" className="p-4">
            <StyleSettings settings={settings} onSettingsChange={onSettingsChange} />
          </TabsContent>

          <TabsContent value="label" className="p-4">
            <PanelLabelSettings settings={settings} onSettingsChange={onSettingsChange} />
          </TabsContent>

          <TabsContent value="noise" className="p-4">
            <NoiseSettings settings={settings} onSettingsChange={onSettingsChange} />
          </TabsContent>

          <TabsContent value="annotations" className="p-4">
            <AnnotationSettings
              annotations={annotations}
              onAnnotationsChange={onAnnotationsChange}
              selectedAnnotation={selectedAnnotation}
              onSelectedAnnotationChange={onSelectedAnnotationChange}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
