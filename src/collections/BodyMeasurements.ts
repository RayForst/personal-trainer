import type { CollectionConfig } from 'payload'

const measurementField = (name: string, label: string) => ({
  name,
  type: 'number' as const,
  required: false,
  label,
  admin: {
    step: 0.1,
    min: 1,
    max: 300,
    description: `Обхват ${label.toLowerCase()}, см`,
  },
})

export const BodyMeasurements: CollectionConfig = {
  slug: 'body-measurements',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'waist', 'chest', 'hips', 'createdAt'],
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
        description: 'Дата замера',
      },
    },
    measurementField('neck', 'Шея'),
    measurementField('shoulders', 'Плечи'),
    measurementField('chest', 'Грудь'),
    measurementField('waist', 'Талия'),
    measurementField('hips', 'Бёдра'),
    measurementField('biceps', 'Бицепс'),
    measurementField('forearm', 'Предплечье'),
    measurementField('thigh', 'Бедро'),
    measurementField('calf', 'Голень'),
  ],
}
