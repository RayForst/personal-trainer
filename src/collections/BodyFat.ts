import type { CollectionConfig } from 'payload'

export const BodyFat: CollectionConfig = {
  slug: 'body-fat',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'value', 'createdAt'],
  },
  fields: [
    {
      name: 'value',
      type: 'number',
      required: true,
      label: 'Процент жира (%)',
      admin: {
        step: 0.1,
        description: 'Процент жира в организме на дату записи',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Дата, когда была сделана запись',
      },
    },
  ],
}
