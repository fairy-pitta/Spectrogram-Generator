"use client"

import type React from "react"
import Image from "next/image"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  FileAudio,
  Info,
  Clock,
  Zap,
  AudioWaveformIcon as Waveform,
  BarChart3,
  Settings2,
  Mail,
} from "lucide-react"
import { SpectrogramCanvas } from "@/components/spectrogram-canvas"
import { SettingsPanel } from "@/components/settings-panel"
import { AnnotationTools } from "@/components/annotation-tools"
import type { SpectrogramSettings, Annotation } from "@/types/spectrogram"

export default function SpectrogramApp() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [spectrogramData, setSpectrogramData] = useState<number[][] | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUploadInfo, setShowUploadInfo] = useState(false)
  const [settings, setSettings] = useState<SpectrogramSettings>({
    fftSize: 2048,
    windowFunction: "hann",
    colormap: "grayscale",
    minFreq: 0,
    maxFreq: 22050,
    minDb: -120,
    maxDb: 0,
    showGrid: true,
    showAxes: true,
    academicStyle: true,
    timeUnit: "s",
    freqUnit: "kHz",
    panelLabel: "A",
    panelLabelColor: "#000000",
    panelLabelSize: 16,
    panelLabelPosition: "top-left",
    panelLabelX: 10,
    panelLabelY: 10,
    noiseReduction: true,
    noiseThreshold: -60,
    signalEnhancement: true,
    contrastBoost: 2.0,
  })
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentTool, setCurrentTool] = useState<"text" | "line" | "rectangle" | "arrow" | "select">("select")
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const [isUploadSectionExpanded, setIsUploadSectionExpanded] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadInfoRef = useRef<HTMLButtonElement>(null)

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return

    setAudioFile(file)
    setIsProcessing(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new AudioContext()
      const buffer = await audioContext.decodeAudioData(arrayBuffer)
      setAudioBuffer(buffer)
      setSettings((prev) => ({ ...prev, maxFreq: buffer.sampleRate / 2 }))
    } catch (error) {
      console.error("Failed to load audio file:", error)
      alert("Failed to load audio file. Please make sure it's a valid WAV file.")
    } finally {
      setIsProcessing(false)
      setIsUploadSectionExpanded(false)
    }
  }, [])

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload],
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      const file = event.dataTransfer.files[0]
      if (file && file.type.startsWith("audio/")) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const generateSpectrogram = useCallback(() => {
    if (!audioBuffer) return

    setIsProcessing(true)

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const channelData = audioBuffer.getChannelData(0)
      const { fftSize } = settings
      const hopSize = fftSize / 4
      const numFrames = Math.floor((channelData.length - fftSize) / hopSize) + 1
      const numBins = fftSize / 2

      const spectrogram: number[][] = []

      for (let frame = 0; frame < numFrames; frame++) {
        const startSample = frame * hopSize
        const frameData = new Float32Array(fftSize)

        for (let i = 0; i < fftSize; i++) {
          const sample = startSample + i < channelData.length ? channelData[startSample + i] : 0
          let window = 1

          if (settings.windowFunction === "hann") {
            window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)))
          } else if (settings.windowFunction === "hamming") {
            window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (fftSize - 1))
          }

          frameData[i] = sample * window
        }

        const fftResult = fft(frameData)
        const magnitudes: number[] = []

        for (let i = 0; i < numBins; i++) {
          const real = fftResult[i * 2]
          const imag = fftResult[i * 2 + 1]
          const magnitude = Math.sqrt(real * real + imag * imag)
          const db = 20 * Math.log10(Math.max(magnitude, 1e-10))
          magnitudes.push(db)
        }

        spectrogram.push(magnitudes)
      }

      // Apply noise reduction if enabled
      if (settings.noiseReduction) {
        for (let frame = 0; frame < spectrogram.length; frame++) {
          for (let bin = 0; bin < spectrogram[frame].length; bin++) {
            if (spectrogram[frame][bin] < settings.noiseThreshold) {
              spectrogram[frame][bin] = settings.minDb
            } else if (settings.signalEnhancement) {
              const enhanced = spectrogram[frame][bin] + (settings.contrastBoost - 1.0) * 10
              spectrogram[frame][bin] = Math.min(settings.maxDb, enhanced)
            }
          }
        }
      }

      setSpectrogramData(spectrogram)
      setIsProcessing(false)
    }, 100)
  }, [audioBuffer, settings])

  // Auto-regenerate when settings change
  useEffect(() => {
    if (audioBuffer) {
      generateSpectrogram()
    }
  }, [audioBuffer, generateSpectrogram])

  // Auto-regenerate when noise reduction settings change
  useEffect(() => {
    if (spectrogramData && audioBuffer) {
      generateSpectrogram()
    }
  }, [settings.noiseReduction, settings.noiseThreshold, settings.signalEnhancement, settings.contrastBoost])

  const fft = (signal: Float32Array): Float32Array => {
    const N = signal.length
    const result = new Float32Array(N * 2)

    for (let i = 0; i < N; i++) {
      result[i * 2] = signal[i]
      result[i * 2 + 1] = 0
    }

    for (let len = 2; len <= N; len *= 2) {
      for (let i = 0; i < N; i += len) {
        for (let j = 0; j < len / 2; j++) {
          const u = i + j
          const v = i + j + len / 2
          const angle = (-2 * Math.PI * j) / len
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)

          const tReal = result[v * 2] * cos - result[v * 2 + 1] * sin
          const tImag = result[v * 2] * sin + result[v * 2 + 1] * cos

          result[v * 2] = result[u * 2] - tReal
          result[v * 2 + 1] = result[u * 2 + 1] - tImag
          result[u * 2] += tReal
          result[u * 2 + 1] += tImag
        }
      }
    }

    return result
  }

  const handleToolChange = useCallback(
    (tool: "text" | "line" | "rectangle" | "arrow") => {
      // If clicking the same tool, toggle to select mode
      if (currentTool === tool) {
        setCurrentTool("select")
      } else {
        setCurrentTool(tool)
      }
    },
    [currentTool],
  )

  const downloadImage = useCallback(() => {
    // Call the download function exposed by the canvas component
    if ((window as any).downloadSpectrogram) {
      ;(window as any).downloadSpectrogram()
    }
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, "0")}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
              <img
                src="https://fairy-pitta.github.io/Spectrogram-Generator/spectrogram_logo.png"
                alt="Spectrogram Generator"
                width="32"
                height="32"
              />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Spectrogram Generator</h1>
            </div>

            <nav className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => window.open("https://singbirds.net/?section=contact#contact", "_blank")}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Main Content */}
        <Card className="border border-gray-200 shadow-sm">
          {audioFile ? (
            // Compact view when file is uploaded
            <CardHeader
              className="bg-white border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsUploadSectionExpanded(!isUploadSectionExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileAudio className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-900">{audioFile.name}</CardTitle>
                    <CardDescription className="text-xs text-gray-600">
                      {formatFileSize(audioFile.size)} •{" "}
                      {audioBuffer ? formatDuration(audioBuffer.duration) : "Loading..."}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    Ready
                  </Badge>
                  <Button variant="ghost" size="sm">
                    {isUploadSectionExpanded ? "−" : "+"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          ) : (
            <CardHeader className="bg-white pb-4">
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Audio File Upload</CardTitle>
                <CardDescription className="text-gray-600">
                  Upload your audio file to get started with spectrogram analysis
                </CardDescription>
              </div>
            </CardHeader>
          )}

          {(!audioFile || isUploadSectionExpanded) && (
            <CardContent className="p-8 pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Select Audio File</h3>
                  <div className="relative">
                    <Button
                      ref={uploadInfoRef}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUploadInfo(!showUploadInfo)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>

                    {showUploadInfo && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUploadInfo(false)} />
                        <Card className="absolute top-8 left-0 z-50 w-80 shadow-lg border border-gray-200">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Supported Audio Formats</CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs space-y-2">
                            <div>
                              <strong>Recommended:</strong> WAV files (uncompressed, high quality)
                            </div>
                            <div>
                              <strong>Sample Rate:</strong> 44.1kHz or higher for best results
                            </div>
                            <div>
                              <strong>Bit Depth:</strong> 16-bit or 24-bit
                            </div>
                            <div>
                              <strong>Channels:</strong> Mono or stereo (first channel will be used)
                            </div>
                            <div>
                              <strong>Max Size:</strong> 100MB recommended for performance
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowUploadInfo(false)}
                              className="w-full mt-2"
                            >
                              Close
                            </Button>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </div>

                <div
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                    isDragOver
                      ? "border-blue-400 bg-blue-50 scale-105"
                      : audioFile
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,audio/wav,audio/wave"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
                      <div>
                        <p className="text-gray-900 font-medium">Processing audio file...</p>
                        <p className="text-gray-600 text-sm">Analyzing audio characteristics</p>
                      </div>
                    </div>
                  ) : audioFile ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                        <FileAudio className="w-10 h-10 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">{audioFile.name}</p>
                        <div className="grid grid-cols-2 gap-6 mt-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="p-1 bg-blue-100 rounded">
                              <BarChart3 className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{formatFileSize(audioFile.size)}</div>
                              <div className="text-xs">File Size</div>
                            </div>
                          </div>
                          {audioBuffer && (
                            <>
                              <div className="flex items-center gap-2 justify-center">
                                <div className="p-1 bg-blue-100 rounded">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {formatDuration(audioBuffer.duration)}
                                  </div>
                                  <div className="text-xs">Duration</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 justify-center">
                                <div className="p-1 bg-blue-100 rounded">
                                  <Zap className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {(audioBuffer.sampleRate / 1000).toFixed(1)}kHz
                                  </div>
                                  <div className="text-xs">Sample Rate</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 justify-center">
                                <div className="p-1 bg-blue-100 rounded">
                                  <Waveform className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {audioBuffer.numberOfChannels} Channel{audioBuffer.numberOfChannels > 1 ? "s" : ""}
                                  </div>
                                  <div className="text-xs">Audio Channels</div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        Choose Different File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                        <Upload className="w-12 h-12 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-gray-900 mb-2">Drop your audio file here</p>
                        <p className="text-gray-600 mb-4">Support for WAV files up to 100MB</p>
                        <p className="text-sm text-gray-500">
                          Perfect for speech analysis, music research, and bioacoustic studies
                        </p>
                      </div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 text-lg"
                        size="lg"
                      >
                        <Upload className="w-5 h-5 mr-3" />
                        Select Audio File
                      </Button>
                    </div>
                  )}
                </div>

                {audioBuffer && !isProcessing && (
                  <Button
                    onClick={generateSpectrogram}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-medium"
                    disabled={isProcessing}
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-5 h-5 mr-3" />
                        Generate Spectrogram
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Professional Features Section */}
        {!audioFile && (
          <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Generate Professional Spectrograms</h2>
                <p className="text-blue-700 text-lg">
                  Create publication-quality spectrograms with advanced analysis tools and customizable parameters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-blue-200">
                  <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Publication Quality</h3>
                  <p className="text-sm text-gray-600">
                    Academic standard output with proper axes, labels, and scientific formatting for research papers
                  </p>
                </div>

                <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-blue-200">
                  <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Settings2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Advanced Controls</h3>
                  <p className="text-sm text-gray-600">
                    Customizable FFT parameters, window functions, color maps, and noise reduction settings
                  </p>
                </div>

                <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-blue-200">
                  <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileAudio className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">High Precision FFT</h3>
                  <p className="text-sm text-gray-600">
                    Professional algorithms with configurable window sizes and overlap for optimal frequency resolution
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {spectrogramData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Main Canvas */}
            <div className="md:col-span-3">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100">
                  <AnnotationTools
                    currentTool={currentTool}
                    onToolChange={handleToolChange}
                    onClearAnnotations={() => {
                      setAnnotations([])
                      setSelectedAnnotation(null)
                    }}
                    onDownload={downloadImage}
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <SpectrogramCanvas
                    spectrogramData={spectrogramData}
                    settings={settings}
                    audioBuffer={audioBuffer}
                    annotations={annotations}
                    onAnnotationsChange={setAnnotations}
                    currentTool={currentTool}
                    selectedAnnotation={selectedAnnotation}
                    onSelectedAnnotationChange={setSelectedAnnotation}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Settings Panel */}
            <div className="md:col-span-1">
              <SettingsPanel
                settings={settings}
                onSettingsChange={setSettings}
                onRegenerate={generateSpectrogram}
                annotations={annotations}
                onAnnotationsChange={setAnnotations}
                selectedAnnotation={selectedAnnotation}
                onSelectedAnnotationChange={setSelectedAnnotation}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
