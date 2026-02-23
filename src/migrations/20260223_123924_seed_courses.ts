import {
  MigrateDownArgs,
  MigrateUpArgs,
} from '@payloadcms/db-mongodb'

const COURSES_TO_SEED = [
  { title: 'React JS фундаментальный курс от А до Я', category: 'react', duration: '3:01:07', status: 'completed' as const, source: 'Ulbi TV', link: 'https://youtu.be/GNrdg3PzpJQ', backgroundImageUrl: 'https://itsg-global.com/wp-content/uploads/2016/09/react-js-to-use-or-not-to-use.png' },
  { title: 'ТОП 5 REACT ХУКОВ (React hooks). Делаем свои React хуки', category: 'react', duration: '29:55', status: 'completed' as const, source: 'Ulbi TV', link: 'https://youtu.be/ks8oftGP2oc', backgroundImageUrl: 'https://itsg-global.com/wp-content/uploads/2016/09/react-js-to-use-or-not-to-use.png' },
  { title: 'React & Redux & TypeScript ПОЛНЫЙ КУРС 2021', category: 'react', duration: '38:45', status: 'completed' as const, source: 'Ulbi TV', link: 'https://youtu.be/ETWABFYv0GM', backgroundImageUrl: 'https://itsg-global.com/wp-content/uploads/2016/09/react-js-to-use-or-not-to-use.png' },
  { title: 'React & Firebase БЫСТРЫЙ КУРС real-time ЧАТ с авторизацией через Google', category: 'react', duration: '31:46', status: 'inProgress' as const, source: 'Ulbi TV', link: 'https://youtu.be/12kgyxvsxUs', backgroundImageUrl: 'https://itsg-global.com/wp-content/uploads/2016/09/react-js-to-use-or-not-to-use.png' },
  { title: 'Redux и React. Все о Redux. Понятная теория для всех. React + redux.', category: 'redux', duration: '4:28', status: 'completed' as const, source: 'Ulbi TV', link: 'https://youtu.be/5Qtqzeh5FeM', backgroundImageUrl: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg' },
  { title: 'Redux и React. State, reducer, action + redux hooks useDispatch и useSelector', category: 'redux', duration: '8:27', status: 'completed' as const, source: 'Ulbi TV', link: 'https://youtu.be/Dzzeir85i3c', backgroundImageUrl: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg' },
  { title: 'Redux и React. Combine Reducers, redux devtools', category: 'redux', duration: '5:09', status: 'completed' as const, source: 'Ulbi TV', link: 'https://youtu.be/ldgnmiPIftw', backgroundImageUrl: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg' },
  { title: 'React и Redux.Action creators. Работа с массивами. Рефакторинг', category: 'redux', duration: '7:07', status: 'completed' as const, source: 'Ulbi TV', link: 'https://youtu.be/WLeK7vIEi5I', backgroundImageUrl: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg' },
  { title: 'React и Redux.Action creators. Redux thunk и асинхронные действия', category: 'redux', duration: '4:01', status: 'completed' as const, source: 'Ulbi TV', link: 'https://youtu.be/CtrWoX_KDjE', backgroundImageUrl: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg' },
  { title: 'Redux и React. Redux saga асинхронные actions', category: 'redux', duration: '13:49', status: 'completed' as const, source: 'Ulbi TV', link: 'https://youtu.be/ylhHYtTyVGE', backgroundImageUrl: 'http://michaelsoriano.com/wp-content/uploads/2020/07/redux.jpg' },
  { title: 'Архитектура многомодульных проектов', category: 'git', duration: '32:06', status: 'planned' as const, source: 'Сергей Мишанин, Банк Санкт-Петербург', link: 'https://youtu.be/uPaVseWC1fc', backgroundImageUrl: 'https://miro.medium.com/max/1200/1*Jl2VDHVzFBDdXggRprziUg.png' },
  { title: 'Try this 3D Animation Trick on your Portfolio', category: 'ui', duration: '5:26', status: 'planned' as const, source: 'Design Course', link: 'https://youtu.be/Ds5J0PFwsxs', backgroundImageUrl: 'https://learn.microsoft.com/training/achievements/aspnetcore/microservices-devops-aspnet-core-social.png' },
  { title: 'С чего начать делать игры', category: 'gamedev', duration: '5:26', status: 'completed' as const, source: 'Кэп Скай', link: 'https://youtu.be/K1ZzX-UOr08', backgroundImageUrl: 'https://xakep.ru/wp-content/uploads/2015/08/game-e.png', description: 'Советует не усложнять. Как первый движок - Юнити, а не Анрил Энжайн из-за легкости освоения. Как 3д - блендер, но лучше пиксель арт и 2д. Язык юнити C#' },
  { title: 'Учим Unity за 1 час! #От Профессионала', category: 'gamedev', duration: '1:59:23', status: 'planned' as const, source: 'Хауди Хо™ - Просто о мире IT!', link: 'https://youtu.be/nRGOW9O7ARk', backgroundImageUrl: 'https://xakep.ru/wp-content/uploads/2015/08/game-e.png' },
]

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({
    collection: 'courses',
    limit: 1,
  })
  if (existing.docs.length > 0) {
    return // Already seeded
  }

  for (const course of COURSES_TO_SEED) {
    await payload.create({
      collection: 'courses',
      data: course,
      req,
    })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const courses = await payload.find({
    collection: 'courses',
    limit: 500,
  })
  for (const course of courses.docs) {
    await payload.delete({
      collection: 'courses',
      id: course.id,
      req,
    })
  }
}
