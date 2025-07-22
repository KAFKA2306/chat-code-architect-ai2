import { db } from './db';
import { users } from '../shared/schema';

async function seed() {
  console.log('Seeding database...');
  await db.insert(users).values([
    { username: 'Alice', email: 'alice@example.com', password: 'password123' },
    { username: 'Bob', email: 'bob@example.com', password: 'password123' },
  ]);
  console.log('Database seeded successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});