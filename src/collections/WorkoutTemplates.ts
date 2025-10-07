import type { CollectionConfig } from 'payload'

export const WorkoutTemplates: CollectionConfig = {
  slug: 'workout-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'description', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Название тренировки',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание',
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
          type: 'number',
          required: true,
          label: 'Количество подходов',
          min: 1,
        },
        {
          name: 'reps',
          type: 'text',
          label: 'Повторения (например: 10-12)',
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
          label: 'Время (например: 30 мин)',
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
}
