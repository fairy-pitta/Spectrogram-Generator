"use client"

import type React from "react"

import { useRef, useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SpectrogramSettings, Annotation } from "@/types/spectrogram"

interface SpectrogramCanvasProps {
  spectrogramData: number[][]
  settings: SpectrogramSettings
  audioBuffer: AudioBuffer | null
  annotations: Annotation[]
  onAnnotationsChange: (annotations: Annotation[]) => void
  currentTool: "text" | "line" | "rectangle" | "arrow" | "select"
  selectedAnnotation: string | null
  onSelectedAnnotationChange: (id: string | null) => void
}

export function SpectrogramCanvas({
  spectrogramData,
  settings,
  audioBuffer,
  annotations,
  onAnnotationsChange,
  currentTool,
  selectedAnnotation,
  onSelectedAnnotationChange,
}: SpectrogramCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showTextInput, setShowTextInput] = useState(false)
  const [pendingTextPosition, setPendingTextPosition] = useState<{ x: number; y: number } | null>(null)
  const [annotationText, setAnnotationText] = useState("Annotation")

  const colormaps = {
    grayscale: ["#ffffff", "#e0e0e0", "#c0c0c0", "#a0a0a0", "#808080", "#606060", "#404040", "#202020", "#000000"],
    viridis: ["#440154", "#482777", "#3f4a8a", "#31678e", "#26838f", "#1f9d8a", "#6cce5a", "#b6de2b", "#fee825"],
    plasma: ["#0d0887", "#5302a3", "#8b0aa5", "#b83289", "#db5c68", "#f48849", "#febd2a", "#f0f921"],
    inferno: ["#000004", "#1b0c41", "#4a0c6b", "#781c6d", "#a52c60", "#cf4446", "#ed6925", "#fb9b06", "#fcffa4"],
    magma: ["#000004", "#1c1044", "#4f127b", "#812581", "#b5367a", "#e55964", "#fb8761", "#fec287", "#fcfdbf"],
  }

  // Get defaults from annotation settings
  const getDefaults = () => {
    const defaults = (window as any).annotationDefaults || {
      text: "Annotation",
      color: "#ef4444",
      fontSize: 14,
    }
    return defaults
  }

  const drawSpectrogram = useCallback(() => {
    if (!spectrogramData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const margin = settings.academicStyle
      ? { top: 50, right: 70, bottom: 60, left: 100 }
      : { top: 20, right: 20, bottom: 20, left: 20 }
    const plotWidth = canvas.width - margin.left - margin.right
    const plotHeight = canvas.height - margin.top - margin.bottom

    // Clear canvas
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw spectrogram
    const imageData = ctx.createImageData(plotWidth, plotHeight)
    const numFrames = spectrogramData.length
    const numBins = spectrogramData[0].length
    const colormap = colormaps[settings.colormap as keyof typeof colormaps]

    for (let x = 0; x < plotWidth; x++) {
      const frameIndex = Math.floor((x / plotWidth) * numFrames)
      if (frameIndex >= numFrames) continue

      for (let y = 0; y < plotHeight; y++) {
        const freqIndex = Math.floor(((plotHeight - y) / plotHeight) * numBins)
        if (freqIndex >= numBins) continue

        const db = spectrogramData[frameIndex][freqIndex]

        // Ensure valid dB range to prevent division by zero or negative ranges
        const dbRange = settings.maxDb - settings.minDb
        let normalizedDb = 0

        if (dbRange > 0) {
          normalizedDb = (db - settings.minDb) / dbRange
        } else if (dbRange < 0) {
          // Handle inverted range
          normalizedDb = (settings.maxDb - db) / Math.abs(dbRange)
        } else {
          // Handle case where min equals max
          normalizedDb = 0.5
        }

        // Clamp normalizedDb to valid range [0, 1]
        normalizedDb = Math.max(0, Math.min(1, normalizedDb))

        // Ensure colorIndex is within valid array bounds
        const colorIndex = Math.floor(normalizedDb * (colormap.length - 1))
        const safeColorIndex = Math.max(0, Math.min(colormap.length - 1, colorIndex))
        const color = colormap[safeColorIndex]

        // Additional safety check
        if (!color || typeof color !== "string" || color.length < 7) {
          continue
        }

        const r = Number.parseInt(color.slice(1, 3), 16)
        const g = Number.parseInt(color.slice(3, 5), 16)
        const b = Number.parseInt(color.slice(5, 7), 16)

        const pixelIndex = (y * plotWidth + x) * 4
        imageData.data[pixelIndex] = r
        imageData.data[pixelIndex + 1] = g
        imageData.data[pixelIndex + 2] = b
        imageData.data[pixelIndex + 3] = 255
      }
    }

    ctx.putImageData(imageData, margin.left, margin.top)

    if (settings.academicStyle) {
      // Draw axes
      if (settings.showAxes) {
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(margin.left, margin.top)
        ctx.lineTo(margin.left, margin.top + plotHeight)
        ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight)
        ctx.stroke()
      }

      // Draw grid
      if (settings.showGrid) {
        ctx.strokeStyle = "#e5e5e5"
        ctx.lineWidth = 0.5
        ctx.setLineDash([2, 2])

        for (let i = 1; i < 10; i++) {
          const x = margin.left + (plotWidth * i) / 10
          ctx.beginPath()
          ctx.moveTo(x, margin.top)
          ctx.lineTo(x, margin.top + plotHeight)
          ctx.stroke()
        }

        for (let i = 1; i < 10; i++) {
          const y = margin.top + (plotHeight * i) / 10
          ctx.beginPath()
          ctx.moveTo(margin.left, y)
          ctx.lineTo(margin.left + plotWidth, y)
          ctx.stroke()
        }

        ctx.setLineDash([])
      }

      // Draw labels and ticks
      ctx.fillStyle = "#374151"
      ctx.font = "11px system-ui, -apple-system, sans-serif"
      ctx.textAlign = "center"

      // Time axis labels - スペクトログラムの直下に配置
      const duration = audioBuffer ? audioBuffer.duration : 1
      for (let i = 0; i <= 10; i++) {
        const x = margin.left + (plotWidth * i) / 10
        const time = (duration * i) / 10
        const label = settings.timeUnit === "s" ? time.toFixed(1) : (time * 1000).toFixed(0)
        ctx.fillText(label, x, margin.top + plotHeight + 20)

        ctx.beginPath()
        ctx.moveTo(x, margin.top + plotHeight)
        ctx.lineTo(x, margin.top + plotHeight + 4)
        ctx.stroke()
      }

      // Frequency axis labels
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      for (let i = 0; i <= 10; i++) {
        const y = margin.top + plotHeight - (plotHeight * i) / 10
        const freq = (settings.maxFreq * i) / 10
        const label = settings.freqUnit === "kHz" ? (freq / 1000).toFixed(1) : freq.toFixed(0)
        ctx.fillText(label, margin.left - 8, y)

        ctx.beginPath()
        ctx.moveTo(margin.left - 4, y)
        ctx.lineTo(margin.left, y)
        ctx.stroke()
      }

      // Axis titles - 時間軸ラベルの下に配置
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.font = "12px system-ui, -apple-system, sans-serif"
      ctx.fillText(`Time (${settings.timeUnit})`, canvas.width / 2, margin.top + plotHeight + 45)

      ctx.save()
      ctx.translate(15, canvas.height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(`Frequency (${settings.freqUnit})`, 0, 0)
      ctx.restore()

      // Panel label with custom styling
      if (settings.panelLabel) {
        ctx.font = `bold ${settings.panelLabelSize}px system-ui, -apple-system, sans-serif`
        ctx.fillStyle = settings.panelLabelColor
        ctx.textAlign = "left"
        ctx.textBaseline = "top"

        let labelX = settings.panelLabelX
        let labelY = settings.panelLabelY

        // Adjust position based on preset positions
        if (settings.panelLabelPosition !== "custom") {
          switch (settings.panelLabelPosition) {
            case "top-left":
              labelX = margin.left + 10
              labelY = margin.top + 10
              break
            case "top-right":
              labelX = margin.left + plotWidth - 30
              labelY = margin.top + 10
              ctx.textAlign = "right"
              break
            case "bottom-left":
              labelX = margin.left + 10
              labelY = margin.top + plotHeight - 30
              break
            case "bottom-right":
              labelX = margin.left + plotWidth - 30
              labelY = margin.top + plotHeight - 30
              ctx.textAlign = "right"
              break
          }
        }

        ctx.fillText(settings.panelLabel, labelX, labelY)
      }
    }

    // Draw annotations
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color
      ctx.fillStyle = annotation.color
      ctx.lineWidth = selectedAnnotation === annotation.id ? 2 : 1

      const x = annotation.x
      const y = annotation.y

      // Draw selection highlight
      if (selectedAnnotation === annotation.id) {
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])

        // Draw different highlights based on annotation type
        if (annotation.type === "text") {
          ctx.strokeRect(x - 3, y - 3, 6, 6)
        } else if (annotation.type === "rectangle" && annotation.width && annotation.height) {
          ctx.strokeRect(x - 3, y - 3, annotation.width + 6, annotation.height + 6)
        } else if (annotation.type === "line" && annotation.endX !== undefined && annotation.endY !== undefined) {
          // Highlight both start and end points
          ctx.strokeRect(x - 3, y - 3, 6, 6)
          ctx.strokeRect(annotation.endX - 3, annotation.endY - 3, 6, 6)
        } else if (annotation.type === "arrow" && annotation.endX !== undefined && annotation.endY !== undefined) {
          // Highlight both start and end points
          ctx.strokeRect(x - 3, y - 3, 6, 6)
          ctx.strokeRect(annotation.endX - 3, annotation.endY - 3, 6, 6)
        }

        ctx.setLineDash([])
        ctx.strokeStyle = annotation.color
        ctx.lineWidth = 1
      }

      if (annotation.type === "text" && annotation.text) {
        ctx.font = `${annotation.fontSize || 14}px system-ui, -apple-system, sans-serif`
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillText(annotation.text, x, y)
      } else if (annotation.type === "line" && annotation.endX !== undefined && annotation.endY !== undefined) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(annotation.endX, annotation.endY)
        ctx.stroke()
      } else if (annotation.type === "rectangle" && annotation.width && annotation.height) {
        ctx.strokeRect(x, y, annotation.width, annotation.height)
      } else if (annotation.type === "arrow" && annotation.endX !== undefined && annotation.endY !== undefined) {
        const endX = annotation.endX
        const endY = annotation.endY

        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        const angle = Math.atan2(endY - y, endX - x)
        const headLength = 12
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(endX, endY)
        ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
      }
    })
  }, [spectrogramData, settings, audioBuffer, annotations, selectedAnnotation])

  const getAnnotationAt = useCallback(
    (x: number, y: number): Annotation | null => {
      for (let i = annotations.length - 1; i >= 0; i--) {
        const annotation = annotations[i]

        if (annotation.type === "text") {
          // Text bounding box
          if (x >= annotation.x - 5 && x <= annotation.x + 150 && y >= annotation.y - 5 && y <= annotation.y + 25) {
            return annotation
          }
        } else if (annotation.type === "rectangle" && annotation.width && annotation.height) {
          // Rectangle area or border
          if (
            x >= annotation.x - 5 &&
            x <= annotation.x + annotation.width + 5 &&
            y >= annotation.y - 5 &&
            y <= annotation.y + annotation.height + 5
          ) {
            return annotation
          }
        } else if (annotation.type === "line" && annotation.endX !== undefined && annotation.endY !== undefined) {
          // Line proximity check - check distance to line
          const lineLength = Math.sqrt(
            Math.pow(annotation.endX - annotation.x, 2) + Math.pow(annotation.endY - annotation.y, 2),
          )
          if (lineLength === 0) {
            // Start and end points are the same
            if (Math.abs(x - annotation.x) < 10 && Math.abs(y - annotation.y) < 10) {
              return annotation
            }
          } else {
            // Calculate distance from point to line
            const A = x - annotation.x
            const B = y - annotation.y
            const C = annotation.endX - annotation.x
            const D = annotation.endY - annotation.y

            const dot = A * C + B * D
            const lenSq = C * C + D * D
            const param = dot / lenSq

            let xx, yy
            if (param < 0) {
              xx = annotation.x
              yy = annotation.y
            } else if (param > 1) {
              xx = annotation.endX
              yy = annotation.endY
            } else {
              xx = annotation.x + param * C
              yy = annotation.y + param * D
            }

            const dx = x - xx
            const dy = y - yy
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 10) {
              return annotation
            }
          }
        } else if (annotation.type === "arrow" && annotation.endX !== undefined && annotation.endY !== undefined) {
          // Similar to line, but also check arrow head area
          const lineLength = Math.sqrt(
            Math.pow(annotation.endX - annotation.x, 2) + Math.pow(annotation.endY - annotation.y, 2),
          )
          if (lineLength === 0) {
            if (Math.abs(x - annotation.x) < 10 && Math.abs(y - annotation.y) < 10) {
              return annotation
            }
          } else {
            // Check line distance
            const A = x - annotation.x
            const B = y - annotation.y
            const C = annotation.endX - annotation.x
            const D = annotation.endY - annotation.y

            const dot = A * C + B * D
            const lenSq = C * C + D * D
            const param = dot / lenSq

            let xx, yy
            if (param < 0) {
              xx = annotation.x
              yy = annotation.y
            } else if (param > 1) {
              xx = annotation.endX
              yy = annotation.endY
            } else {
              xx = annotation.x + param * C
              yy = annotation.y + param * D
            }

            const dx = x - xx
            const dy = y - yy
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 10) {
              return annotation
            }

            // Also check arrow head area
            if (Math.abs(x - annotation.endX) < 15 && Math.abs(y - annotation.endY) < 15) {
              return annotation
            }
          }
        }
      }
      return null
    },
    [annotations],
  )

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const scaleX = canvasRef.current.width / rect.width
      const scaleY = canvasRef.current.height / rect.height

      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY

      // Check if clicking on existing annotation (for select mode or any mode)
      const clickedAnnotation = getAnnotationAt(x, y)

      if (clickedAnnotation && (currentTool === "select" || event.ctrlKey || event.metaKey)) {
        onSelectedAnnotationChange(clickedAnnotation.id)
        setIsDragging(true)
        setDragOffset({
          x: x - clickedAnnotation.x,
          y: y - clickedAnnotation.y,
        })
        return
      }

      // If not selecting annotation, clear selection
      onSelectedAnnotationChange(null)

      // Handle drawing modes
      if (currentTool === "text") {
        setPendingTextPosition({ x, y })
        setAnnotationText(getDefaults().text)
        setShowTextInput(true)
      } else if (["line", "rectangle", "arrow"].includes(currentTool)) {
        if (!isDrawing) {
          setCurrentAnnotation({
            id: Date.now().toString(),
            type: currentTool as "line" | "rectangle" | "arrow",
            x,
            y,
            color: getDefaults().color,
          })
          setIsDrawing(true)
        } else {
          if (currentAnnotation) {
            const finalAnnotation: Annotation = {
              ...currentAnnotation,
              ...(currentTool === "rectangle"
                ? { width: x - currentAnnotation.x, height: y - currentAnnotation.y }
                : { endX: x, endY: y }),
            }
            onAnnotationsChange([...annotations, finalAnnotation])
          }
          setIsDrawing(false)
          setCurrentAnnotation(null)
        }
      }
    },
    [
      currentTool,
      isDrawing,
      currentAnnotation,
      annotations,
      onAnnotationsChange,
      getAnnotationAt,
      onSelectedAnnotationChange,
    ],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !selectedAnnotation || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const scaleX = canvasRef.current.width / rect.width
      const scaleY = canvasRef.current.height / rect.height

      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY

      const newX = x - dragOffset.x
      const newY = y - dragOffset.y

      onAnnotationsChange(
        annotations.map((annotation) =>
          annotation.id === selectedAnnotation ? { ...annotation, x: newX, y: newY } : annotation,
        ),
      )
    },
    [isDragging, selectedAnnotation, dragOffset, annotations, onAnnotationsChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTextSubmit = useCallback(() => {
    if (pendingTextPosition && annotationText.trim()) {
      const defaults = getDefaults()
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: "text",
        x: pendingTextPosition.x,
        y: pendingTextPosition.y,
        text: annotationText.trim(),
        color: defaults.color,
        fontSize: defaults.fontSize,
      }
      onAnnotationsChange([...annotations, newAnnotation])
    }
    setShowTextInput(false)
    setPendingTextPosition(null)
  }, [pendingTextPosition, annotationText, annotations, onAnnotationsChange])

  const downloadImage = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement("a")
    link.download = `spectrogram_${settings.panelLabel || "panel"}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }, [settings.panelLabel])

  // Expose download function to parent
  useEffect(() => {
    ;(window as any).downloadSpectrogram = downloadImage
  }, [downloadImage])

  useEffect(() => {
    drawSpectrogram()
  }, [drawSpectrogram])

  return (
    <>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          className={`w-full border border-gray-200 bg-white ${currentTool === "select" ? "cursor-pointer" : "cursor-crosshair"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {isDrawing && (
          <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded shadow text-xs text-gray-600">
            {currentTool === "line" && "Click end point for line"}
            {currentTool === "rectangle" && "Click opposite corner"}
            {currentTool === "arrow" && "Click end point for arrow"}
          </div>
        )}
        {selectedAnnotation && (
          <div className="absolute bottom-2 right-2 bg-blue-50 px-2 py-1 rounded shadow text-xs text-blue-700">
            Drag to move annotation (or use Ctrl+click to select while in drawing mode)
          </div>
        )}
      </div>

      {showTextInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add Text Annotation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="annotation-text">Text</Label>
                <Textarea
                  id="annotation-text"
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Enter annotation text"
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleTextSubmit} className="flex-1">
                  Add
                </Button>
                <Button variant="outline" onClick={() => setShowTextInput(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
