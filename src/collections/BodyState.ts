import type { CollectionConfig } from 'payload'

export const BodyState: CollectionConfig = {
  slug: 'body-state',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'weight', 'createdAt'],
  },
  fields: [
    {
      name: 'weight',
      type: 'number',
      required: true,
      label: 'Вес (кг)',
      admin: {
        step: 0.1,
        description: 'Ваш вес на дату записи',
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
