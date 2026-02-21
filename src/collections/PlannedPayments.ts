import type { CollectionConfig } from 'payload'

export const PlannedPayments: CollectionConfig = {
  slug: 'planned-payments',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'amount', 'priority', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Название',
      admin: {
        description: 'Например: Spotify, Netflix, спортзал',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'Сумма в месяц (€)',
      admin: {
        step: 0.01,
        description: 'Ежемесячная сумма платежа',
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
        description: 'Уровень важности платежа',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
      label: 'Заметки',
      admin: {
        description: 'Опционально: дата списания, ссылка на отмену и т.д.',
      },
    },
  ],
}
