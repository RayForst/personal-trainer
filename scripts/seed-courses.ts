/**
 * Скрипт для загрузки курсов в базу данных.
 * Запуск: pnpm seed:courses
 *
 * Добавляет только те курсы, которых ещё нет (по названию).
 * Для обновления существующих — удалите курсы в админке и запустите снова.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const CATEGORY_MAP: Record<string, string> = {
  React: 'react',
  Redux: 'redux',
  Git: 'git',
  UI: 'ui',
  Gamedev: 'gamedev',
}

const COURSES_TO_SEED = [
  {
    category: 'React',
    placeholderImage: 'https://itsg-global.com/wp-content/uploads/2016/09/react-js-to-use-or-not-to-use.png',
    name: 'React JS фундаментальный курс от А до Я',
    author: 'Ulbi TV',
    link: 'https://youtu.be/GNrdg3PzpJQ',
    duration: '3:01:07',
    status: 'completed',
  },
  {
    category: 'React',
    placeholderImage: 'https://itsg-global.com/wp-content/uploads/2016/09/react-js-to-use-or-not-to-use.png',
    name: 'ТОП 5 REACT ХУКОВ (React hooks). Делаем свои React хуки',
    author: 'Ulbi TV',
    link: 'https://youtu.be/ks8oftGP2oc',
    duration: '29:55',
    status: 'completed',
  },
  {
    category: 'React',
    placeholderImage: 'https://itsg-global.com/wp-content/uploads/2016/09/react-js-to-use-or-not-to-use.png',
    name: 'React & Redux & TypeScript ПОЛНЫЙ КУРС 2021',
    author: 'Ulbi TV',
    link: 'https://youtu.be/ETWABFYv0GM',
    duration: '38:45',
    status: 'completed',
  },
  {
    category: 'React',
    placeholderImage: 'https://itsg-global.com/wp-content/uploads/2016/09/react-js-to-use-or-not-to-use.png',
    name: 'React & Firebase БЫСТРЫЙ КУРС real-time ЧАТ с авторизацией через Google',
    author: 'Ulbi TV',
    link: 'https://youtu.be/12kgyxvsxUs',
    duration: '31:46',
    status: 'inProgress',
  },
  {
    category: 'Redux',
    placeholderImage: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg',
    name: 'Redux и React. Все о Redux. Понятная теория для всех. React + redux.',
    author: 'Ulbi TV',
    link: 'https://youtu.be/5Qtqzeh5FeM',
    duration: '4:28',
    status: 'completed',
  },
  {
    category: 'Redux',
    placeholderImage: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg',
    name: 'Redux и React. State, reducer, action + redux hooks useDispatch и useSelector',
    author: 'Ulbi TV',
    link: 'https://youtu.be/Dzzeir85i3c',
    duration: '8:27',
    status: 'completed',
  },
  {
    category: 'Redux',
    placeholderImage: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg',
    name: 'Redux и React. Combine Reducers, redux devtools',
    author: 'Ulbi TV',
    link: 'https://youtu.be/ldgnmiPIftw',
    duration: '5:09',
    status: 'completed',
  },
  {
    category: 'Redux',
    placeholderImage: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg',
    name: 'React и Redux.Action creators. Работа с массивами. Рефакторинг',
    author: 'Ulbi TV',
    link: 'https://youtu.be/WLeK7vIEi5I',
    duration: '7:07',
    status: 'completed',
  },
  {
    category: 'Redux',
    placeholderImage: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg',
    name: 'React и Redux.Action creators. Redux thunk и асинхронные действия',
    author: 'Ulbi TV',
    link: 'https://youtu.be/CtrWoX_KDjE',
    duration: '4:01',
    status: 'completed',
  },
  {
    category: 'Redux',
    placeholderImage: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg',
    name: 'Redux и React. Redux saga асинхронные actions',
    author: 'Ulbi TV',
    link: 'https://youtu.be/ylhHYtTyVGE',
    duration: '13:49',
    status: 'completed',
  },
  {
    category: 'Git',
    placeholderImage: 'https://miro.medium.com/max/1200/1*Jl2VDHVzFBDdXggRprziUg.png',
    name: 'Архитектура многомодульных проектов',
    author: 'Сергей Мишанин, Банк Санкт-Петербург',
    link: 'https://youtu.be/uPaVseWC1fc',
    duration: '32:06',
    status: 'planned',
  },
  {
    category: 'UI',
    placeholderImage: 'https://learn.microsoft.com/training/achievements/aspnetcore/microservices-devops-aspnet-core-social.png',
    name: 'Try this 3D Animation Trick on your Portfolio',
    author: 'Design Course',
    link: 'https://youtu.be/Ds5J0PFwsxs',
    duration: '5:26',
    status: 'planned',
    description: '',
  },
  {
    category: 'Gamedev',
    placeholderImage: 'https://xakep.ru/wp-content/uploads/2015/08/game-e.png',
    name: 'С чего начать делать игры',
    author: 'Кэп Скай',
    link: 'https://youtu.be/K1ZzX-UOr08',
    duration: '5:26',
    status: 'completed',
    description:
      'Советует не усложнять. Как первый движок - Юнити, а не Анрил Энжайн из-за легкости освоения. Как 3д - блендер, но лучше пиксель арт и 2д. Язык юнити C#',
  },
  {
    category: 'Gamedev',
    placeholderImage: 'https://xakep.ru/wp-content/uploads/2015/08/game-e.png',
    name: 'Учим Unity за 1 час! #От Профессионала',
    author: 'Хауди Хо™ - Просто о мире IT!',
    link: 'https://youtu.be/nRGOW9O7ARk',
    duration: '1:59:23',
    status: 'planned',
    description: '',
  },
]

async function main() {
  if (!process.env.DATABASE_URI) {
    console.error('Ошибка: DATABASE_URI не задан в .env')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'courses',
    limit: 500,
  })
  const existingTitles = new Set(existing.docs.map((c) => c.title))

  let added = 0
  for (const raw of COURSES_TO_SEED) {
    if (existingTitles.has(raw.name)) {
      console.log(`Пропуск (уже есть): ${raw.name}`)
      continue
    }
    const course = {
      title: raw.name,
      category: CATEGORY_MAP[raw.category] || 'react',
      duration: raw.duration,
      status: raw.status as 'completed' | 'inProgress' | 'planned',
      source: raw.author,
      link: raw.link || null,
      description: raw.description || null,
      backgroundImageUrl: raw.placeholderImage || null,
    }
    await payload.create({
      collection: 'courses',
      data: course,
    })
    added++
    console.log(`Добавлено: ${raw.name}`)
  }

  console.log(`\nГотово. Добавлено курсов: ${added}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
