'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { ZoomIn, ZoomOut } from 'lucide-react'

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: '%', width: 80 },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

interface ImageCropperProps {
  open: boolean
  onClose: () => void
  file: File | null
  aspect?: number
  circular?: boolean
  onCropComplete: (blob: Blob) => void
}

export function ImageCropper({
  open,
  onClose,
  file,
  aspect = 1,
  circular = true,
  onCropComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [zoom, setZoom] = useState(1)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgSrc, setImgSrc] = useState('')

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height, aspect))
    },
    [aspect]
  )

  const handleComplete = () => {
    if (!imgRef.current || !crop) return

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const pixelCrop = {
      x: (crop.x / 100) * image.width * scaleX,
      y: (crop.y / 100) * image.height * scaleY,
      width: (crop.width / 100) * image.width * scaleX,
      height: (crop.height / 100) * image.height * scaleY,
    }

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (circular) {
      ctx.beginPath()
      ctx.arc(
        pixelCrop.width / 2,
        pixelCrop.height / 2,
        Math.min(pixelCrop.width, pixelCrop.height) / 2,
        0,
        2 * Math.PI
      )
      ctx.closePath()
      ctx.clip()
    }

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    canvas.toBlob(
      (blob) => {
        if (blob) onCropComplete(blob)
      },
      'image/jpeg',
      0.9
    )
  }

  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImgSrc(reader.result as string)
      setZoom(1)
      setCrop(undefined)
    }
    reader.readAsDataURL(file)
  }, [file])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{circular ? '裁剪头像' : '裁剪图片'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="relative max-h-[50vh] overflow-hidden rounded-lg bg-muted">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCrop(c)}
                aspect={aspect}
                circularCrop={circular}
                className="max-h-[50vh]"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt=""
                  onLoad={onImageLoad}
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                  className="max-h-[50vh] object-contain"
                />
              </ReactCrop>
            )}
          </div>
          <div className="flex items-center gap-3 w-full max-w-xs">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom * 100]}
              onValueChange={([v]: number[]) => setZoom(v / 100)}
              min={50}
              max={200}
              step={1}
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleComplete}>确认裁剪</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
