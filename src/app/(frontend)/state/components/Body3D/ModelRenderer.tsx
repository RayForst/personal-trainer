'use client'

import React, { useRef } from 'react'
import { useSceneSetup } from './useSceneSetup'
import type { Group } from 'three'

interface ModelRendererProps {
  model: Group | null
}

export default function ModelRenderer({ model }: ModelRendererProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useSceneSetup(model, mountRef)

  return (
    <div
      ref={mountRef}
      className="w-full h-full min-h-[320px] overflow-hidden"
    />
  )
}
