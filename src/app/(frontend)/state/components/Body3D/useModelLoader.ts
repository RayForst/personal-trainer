'use client'

import { useEffect, useState } from 'react'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import type { Group } from 'three'

export function useModelLoader(modelPath: string) {
  const [model, setModel] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loader = new FBXLoader()
    loader.load(
      modelPath,
      (fbx) => {
        fbx.scale.set(0.01, 0.01, 0.01)
        fbx.position.set(0, 0, 0)
        setModel(fbx)
        setLoading(false)
      },
      undefined,
      (error) => {
        console.error('Ошибка при загрузке модели:', error)
        setLoading(false)
      },
    )
  }, [modelPath])

  return { model, loading }
}
