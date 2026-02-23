import type { CollectionConfig } from 'payload'

const photoField = (name: string, label: string) => ({
  name,
  type: 'upload' as const,
  relationTo: 'media' as const,
  required: false,
  label,
  admin: {
    description: `Фото ${label.toLowerCase()}`,
  },
})

export const BodyPhotos: CollectionConfig = {
  slug: 'body-photos',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'createdAt'],
  },
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Дата съёмки',
      },
    },
    photoField('front', 'Спереди'),
    photoField('back', 'Сзади'),
    photoField('left', 'Слева'),
    photoField('right', 'Справа'),
  ],
}
