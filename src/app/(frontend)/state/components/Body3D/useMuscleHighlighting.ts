'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Group } from 'three'

type VertexCoord = [number, number, number]

function muscleZonesContainsVertex(
  vertexIndex: number,
  coordinatesArray: VertexCoord[],
  geometry: THREE.BufferGeometry,
): boolean {
  const tolerance = 0.01
  const pos = geometry.attributes.position.array as Float32Array
  const x = pos[vertexIndex * 3]
  const y = pos[vertexIndex * 3 + 1]
  const z = pos[vertexIndex * 3 + 2]

  return coordinatesArray.some(([vx, vy, vz]) => {
    return (
      Math.abs(x - vx) < tolerance &&
      Math.abs(y - vy) < tolerance &&
      Math.abs(z - vz) < tolerance
    )
  })
}

export function useMuscleHighlighting(
  model: Group | null,
  muscleCoordinates: VertexCoord[],
) {
  const [isColoring, setIsColoring] = useState(false)
  const [isColored, setIsColored] = useState(false)
  const originalColorsRef = useRef<Float32Array | null>(null)

  const toggleColor = () => {
    setIsColoring(true)
    setIsColored((prev) => !prev)
  }

  useEffect(() => {
    if (model) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const geometry = child.geometry
          const count = geometry.attributes.position.count

          if (!geometry.attributes.color) {
            const colors = new Float32Array(count * 3)
            const mat = child.material as THREE.MeshStandardMaterial
            const c = mat.color
            for (let i = 0; i < count; i++) {
              colors[i * 3] = c.r
              colors[i * 3 + 1] = c.g
              colors[i * 3 + 2] = c.b
            }
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
          }

          if (!originalColorsRef.current && geometry.attributes.color) {
            originalColorsRef.current = new Float32Array(
              (geometry.attributes.color as THREE.BufferAttribute).array,
            )
          }

          child.material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.75,
          })
        }
      })
    }
  }, [model])

  useEffect(() => {
    if (model && isColoring && originalColorsRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const geometry = child.geometry
              const colorAttr = geometry.attributes.color
              if (!colorAttr) return
              const colors = colorAttr.array as Float32Array
              const count = geometry.attributes.position.count

              for (let i = 0; i < count; i++) {
                if (
                  isColored &&
                  muscleZonesContainsVertex(i, muscleCoordinates, geometry)
                ) {
                  colors[i * 3] = 1
                  colors[i * 3 + 1] = 0
                  colors[i * 3 + 2] = 0
                } else {
                  colors[i * 3] = originalColorsRef.current![i * 3]
                  colors[i * 3 + 1] = originalColorsRef.current![i * 3 + 1]
                  colors[i * 3 + 2] = originalColorsRef.current![i * 3 + 2]
                }
              }

              colorAttr.needsUpdate = true
            }
          })

          setIsColoring(false)
        })
      })
    }
  }, [isColored, model, isColoring, muscleCoordinates])

  return { isColoring, isColored, toggleColor }
}
