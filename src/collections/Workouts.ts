import type { CollectionConfig } from 'payload'

export const Workouts: CollectionConfig = {
  slug: 'workouts',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Название тренировки',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата тренировки',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'workout-templates',
      label: 'Шаблон тренировки (опционально)',
    },
    {
      name: 'exercises',
      type: 'array',
      label: 'Упражнения',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Название упражнения',
        },
        {
          name: 'exerciseType',
          type: 'select',
          required: true,
          label: 'Тип упражнения',
          options: [
            {
              label: 'Силовое (вес + повторения)',
              value: 'strength',
            },
            {
              label: 'Кардио (время)',
              value: 'cardio',
            },
          ],
          defaultValue: 'strength',
        },
        {
          name: 'sets',
          type: 'array',
          label: 'Подходы',
          fields: [
            {
              name: 'reps',
              type: 'text',
              label: 'Повторения',
              admin: {
                condition: (data, siblingData) => {
                  return siblingData?.exerciseType === 'strength'
                },
              },
            },
            {
              name: 'weight',
              type: 'text',
              label: 'Вес (кг)',
              admin: {
                condition: (data, siblingData) => {
                  return siblingData?.exerciseType === 'strength'
                },
              },
            },
            {
              name: 'duration',
              type: 'text',
              label: 'Время (мин:сек)',
              admin: {
                condition: (data, siblingData) => {
                  return siblingData?.exerciseType === 'cardio'
                },
              },
            },
            {
              name: 'distance',
              type: 'text',
              label: 'Дистанция (км)',
              admin: {
                condition: (data, siblingData) => {
                  return siblingData?.exerciseType === 'cardio'
                },
              },
            },
            {
              name: 'notes',
              type: 'textarea',
              label: 'Заметки',
            },
          ],
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Общие заметки о тренировке',
    },
    {
      name: 'duration',
      type: 'number',
      label: 'Длительность тренировки (минуты)',
    },
  ],
}
