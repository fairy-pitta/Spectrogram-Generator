import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spectrogram Generator',
  description: 'Create a Professional Spectrogram of your Audio',
  icons: {
    icon: '/spectrogram_logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
