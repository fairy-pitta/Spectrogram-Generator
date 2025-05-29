export interface SpectrogramSettings {
  fftSize: number
  windowFunction: string
  colormap: string
  minFreq: number
  maxFreq: number
  minDb: number
  maxDb: number
  showGrid: boolean
  showAxes: boolean
  academicStyle: boolean
  timeUnit: string
  freqUnit: string
  panelLabel: string
  panelLabelColor: string
  panelLabelSize: number
  panelLabelPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "custom"
  panelLabelX: number
  panelLabelY: number
  noiseReduction: boolean
  noiseThreshold: number
  signalEnhancement: boolean
  contrastBoost: number
}

export interface Annotation {
  id: string
  type: "text" | "line" | "rectangle" | "arrow"
  x: number
  y: number
  width?: number
  height?: number
  endX?: number
  endY?: number
  text?: string
  color: string
  fontSize?: number
  arrowStyle?: "simple" | "filled"
}
