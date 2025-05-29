"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"
import { useState, useRef, type ReactNode } from "react"

interface InfoPopupProps {
  title: string
  children: ReactNode
}

export function InfoPopup({ title, children }: InfoPopupProps) {
  const [showInfo, setShowInfo] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative">
      <Button ref={buttonRef} variant="ghost" size="sm" onClick={() => setShowInfo(!showInfo)}>
        <Info className="h-4 w-4" />
      </Button>

      {showInfo && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowInfo(false)} />
          <Card className="absolute top-8 right-0 z-50 w-80 shadow-lg border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              {children}
              <Button size="sm" variant="outline" onClick={() => setShowInfo(false)} className="w-full mt-2">
                Close
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
