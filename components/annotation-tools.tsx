"use client"

import { Button } from "@/components/ui/button"
import { CardTitle } from "@/components/ui/card"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Type, Minus, Square, ArrowRight, RotateCcw, Download, HelpCircle, MousePointer } from "lucide-react"
import { useState, useRef } from "react"

interface AnnotationToolsProps {
  currentTool: "text" | "line" | "rectangle" | "arrow" | "select"
  onToolChange: (tool: "text" | "line" | "rectangle" | "arrow") => void
  onClearAnnotations: () => void
  onDownload: () => void
}

export function AnnotationTools({ currentTool, onToolChange, onClearAnnotations, onDownload }: AnnotationToolsProps) {
  const [showHelp, setShowHelp] = useState(false)
  const helpButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Spectrogram
          {currentTool === "select" && (
            <span className="ml-2 text-sm font-normal text-blue-600">(Select/Drag Mode)</span>
          )}
        </CardTitle>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button ref={helpButtonRef} variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)}>
              <HelpCircle className="w-4 h-4" />
            </Button>

            {showHelp && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHelp(false)} />
                <Card className="absolute top-8 right-0 z-50 w-80 shadow-lg border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-900">Annotation Tools Guide</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <div>
                      <strong>🖱️ Select Mode:</strong> Click annotation tools twice to enter select/drag mode
                    </div>
                    <div>
                      <strong>📝 Text:</strong> Click to place text annotations anywhere on the canvas
                    </div>
                    <div>
                      <strong>📏 Shapes:</strong> Click start point, then end point to draw lines, rectangles, or arrows
                    </div>
                    <div>
                      <strong>🎯 Move:</strong> In select mode, click and drag any annotation to reposition it
                    </div>
                    <div>
                      <strong>🎨 Customize:</strong> Use the "Notes" tab to set colors, sizes, and edit annotations
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setShowHelp(false)} className="w-full mt-2">
                      Close
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="flex gap-1 border border-gray-200 rounded-md p-1">
            {currentTool === "select" && (
              <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                <MousePointer className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant={currentTool === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange("text")}
              className={currentTool === "text" ? "bg-blue-600 hover:bg-blue-700" : ""}
              title="Text annotation (T)"
            >
              <Type className="w-4 h-4" />
            </Button>

            <Button
              variant={currentTool === "line" ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange("line")}
              className={currentTool === "line" ? "bg-blue-600 hover:bg-blue-700" : ""}
              title="Draw line (L)"
            >
              <Minus className="w-4 h-4" />
            </Button>

            <Button
              variant={currentTool === "rectangle" ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange("rectangle")}
              className={currentTool === "rectangle" ? "bg-blue-600 hover:bg-blue-700" : ""}
              title="Draw rectangle (R)"
            >
              <Square className="w-4 h-4" />
            </Button>

            <Button
              variant={currentTool === "arrow" ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange("arrow")}
              className={currentTool === "arrow" ? "bg-blue-600 hover:bg-blue-700" : ""}
              title="Draw arrow (A)"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onClearAnnotations} title="Clear all annotations">
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            onClick={onDownload}
            className="bg-green-600 hover:bg-green-700 text-white"
            title="Download as PNG (Ctrl+D)"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
