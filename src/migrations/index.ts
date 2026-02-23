import * as migration_20260223_123924_seed_courses from './20260223_123924_seed_courses';

export const migrations = [
  {
    up: migration_20260223_123924_seed_courses.up,
    down: migration_20260223_123924_seed_courses.down,
    name: '20260223_123924_seed_courses'
  },
];
