import { useState, useEffect, useCallback } from 'react'
import * as faceapi from '@vladmandic/face-api'

// Models served from CDN (jsdelivr mirrors the npm package files)
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

// Euclidean distance threshold — face-api docs recommend 0.6;
// we use 0.52 so casual lookalikes don't pass but the same person in
// different lighting/angle still does.
export const IDENTITY_MISMATCH_THRESHOLD = 0.52

export function euclideanDistance(a: Float32Array, b: Float32Array): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

export function useFaceVerification() {
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
        setIsReady(true)
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load face recognition models',
        )
      }
    })()
  }, [])

  /**
   * Extract a 128-d face embedding from a video / canvas / image element.
   * Returns null if no face is detected or models aren't loaded yet.
   */
  const extractDescriptor = useCallback(
    async (
      source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    ): Promise<Float32Array | null> => {
      if (!isReady) return null
      try {
        const detection = await faceapi
          .detectSingleFace(
            source as HTMLVideoElement,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }),
          )
          .withFaceLandmarks(true)
          .withFaceDescriptor()
        return detection ? (detection.descriptor as Float32Array) : null
      } catch {
        return null
      }
    },
    [isReady],
  )

  return { isReady, loadError, extractDescriptor }
}
