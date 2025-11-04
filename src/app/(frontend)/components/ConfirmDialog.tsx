'use client'

import { toast } from 'sonner'

export const confirmAction = async (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const toastId = toast(message, {
      duration: Infinity,
      action: {
        label: 'Подтвердить',
        onClick: () => {
          toast.dismiss(toastId)
          resolve(true)
        },
      },
      cancel: {
        label: 'Отмена',
        onClick: () => {
          toast.dismiss(toastId)
          resolve(false)
        },
      },
    })
  })
}
