import type { CollectionConfig } from 'payload'

export const GoalActivityRecords: CollectionConfig = {
  slug: 'goal-activity-records',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['goal', 'date', 'value', 'createdAt'],
  },
  fields: [
    {
      name: 'goal',
      type: 'relationship',
      relationTo: 'goals',
      required: true,
      label: 'Цель',
      admin: {
        description: 'Глобальная цель, к которой относится эта запись активности',
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
        description: 'Дата, за которую записывается активность',
      },
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      label: 'Значение',
      admin: {
        description: 'Значение активности за этот день (например, количество сигарет, секунды прыжков)',
      },
    },
  ],
}

