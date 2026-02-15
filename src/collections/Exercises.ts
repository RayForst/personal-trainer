import type { CollectionConfig } from 'payload'

export const Exercises: CollectionConfig = {
  slug: 'exercises',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'exerciseType', 'muscleGroup', 'createdAt'],
  },
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
      name: 'muscleGroup',
      type: 'select',
      label: 'Группа мышц',
      options: [
        { label: 'Грудь', value: 'chest' },
        { label: 'Спина', value: 'back' },
        { label: 'Плечи', value: 'shoulders' },
        { label: 'Руки', value: 'arms' },
        { label: 'Ноги', value: 'legs' },
        { label: 'Пресс', value: 'core' },
        { label: 'Кардио', value: 'cardio' },
        { label: 'Другое', value: 'other' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание упражнения',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Заметки',
    },
  ],
}
