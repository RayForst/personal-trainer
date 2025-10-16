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
    {
      name: 'isSkip',
      type: 'checkbox',
      label: 'Пропуск тренировки',
      defaultValue: false,
    },
    {
      name: 'skipEndDate',
      type: 'date',
      label: 'Дата окончания пропуска (для диапазона)',
      admin: {
        condition: (data) => data.isSkip === true,
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'skipReason',
      type: 'select',
      label: 'Причина пропуска',
      options: [
        { label: 'Травма', value: 'injury' },
        { label: 'Болезнь', value: 'illness' },
        { label: 'Закрытый зал', value: 'gym-closed' },
        { label: 'Стихийное бедствие', value: 'natural-disaster' },
        { label: 'Работа', value: 'work' },
        { label: 'Поездка', value: 'travel' },
        { label: 'Семейные дела', value: 'family' },
        { label: 'Лень', value: 'lazy' },
        { label: 'Другое', value: 'other' },
      ],
      admin: {
        condition: (data) => data.isSkip === true,
      },
    },
    {
      name: 'customReason',
      type: 'text',
      label: 'Укажите причину пропуска',
      admin: {
        condition: (data) => data.isSkip === true && data.skipReason === 'other',
      },
    },
    {
      name: 'skipColor',
      type: 'select',
      label: 'Цвет для отображения пропуска',
      options: [
        { label: 'Синий', value: 'blue' },
        { label: 'Красный', value: 'red' },
        { label: 'Оранжевый', value: 'orange' },
        { label: 'Желтый', value: 'yellow' },
      ],
      defaultValue: 'blue',
      admin: {
        condition: (data) => data.isSkip === true,
      },
    },
  ],
}
