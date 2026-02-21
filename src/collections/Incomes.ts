import type { CollectionConfig } from 'payload'

export const Incomes: CollectionConfig = {
  slug: 'incomes',
  admin: {
    useAsTitle: 'source',
    defaultColumns: ['amount', 'source', 'receiptDate', 'createdAt'],
  },
  fields: [
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'Сумма (€)',
      admin: {
        step: 0.01,
        description: 'Сумма дохода в месяц',
      },
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      label: 'Источник дохода',
      admin: {
        description: 'Например: Зарплата, Фриланс, Аренда',
      },
    },
    {
      name: 'receiptDate',
      type: 'date',
      required: false,
      label: 'Дата получения',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'День месяца, когда приходит доход (опционально)',
      },
    },
  ],
}
