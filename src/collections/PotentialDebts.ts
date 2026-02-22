import type { CollectionConfig } from 'payload'

export const PotentialDebts: CollectionConfig = {
  slug: 'potential-debts',
  admin: {
    useAsTitle: 'who',
    defaultColumns: ['amount', 'who', 'priority', 'returnDate', 'isMonthlyPayment', 'monthlyAmount', 'createdAt'],
  },
  fields: [
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'Сумма (€)',
      admin: {
        step: 0.01,
        description: 'Сумма потенциального долга в евро',
      },
    },
    {
      name: 'who',
      type: 'text',
      required: true,
      label: 'Кто кому должен',
      admin: {
        description: 'Например: Иван мне, Я Маше',
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
        description: 'Уровень важности',
      },
    },
    {
      name: 'returnDate',
      type: 'date',
      required: false,
      label: 'Дата отдачи',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Когда планируется вернуть (опционально)',
      },
    },
    {
      name: 'isMonthlyPayment',
      type: 'checkbox',
      defaultValue: false,
      label: 'Ежемесячная оплата',
      admin: {
        description: 'Включить, если есть ежемесячные платежи',
      },
    },
    {
      name: 'monthlyAmount',
      type: 'number',
      required: false,
      label: 'Ежемесячный платёж (€)',
      admin: {
        step: 0.01,
        description: 'Сумма ежемесячного платежа',
        condition: (data) => data?.isMonthlyPayment === true,
      },
    },
  ],
}
