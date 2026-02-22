import type { CollectionConfig } from 'payload'

export const DesiredExpenses: CollectionConfig = {
  slug: 'desired-expenses',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'amount', 'priority', 'targetDate', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Название',
      admin: {
        description: 'Например: Машина, новый iPhone, отпуск',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'Сумма (€)',
      admin: {
        step: 0.01,
        description: 'Сколько хотите потратить',
      },
    },
    {
      name: 'targetDate',
      type: 'date',
      required: false,
      label: 'Желаемый срок',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Опционально: к какому времени хотите купить (например, к лету)',
      },
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'normal',
      label: 'Приоритетность',
      options: [
        { label: 'Неприоритетный', value: 'low' },
        { label: 'Обычный', value: 'normal' },
        { label: 'Важный', value: 'high' },
      ],
      admin: {
        description: 'Насколько важно для вас',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
      label: 'Заметки',
      admin: {
        description: 'Опционально',
      },
    },
  ],
}
