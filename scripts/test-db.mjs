import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fEVAzNd0F9vx@ep-late-math-atz9tvgo-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
  console.log('Testing Neon Serverless connection to:', connectionString.replace(/:[^:]*@/, ':***@'));
  const pool = new Pool({ connectionString });
  try {
    const res = await pool.query('SELECT 1 as connected, current_database(), current_user');
    console.log('Connected successfully to Neon DB:', res.rows);

    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Existing tables in Neon DB:', tables.rows);
  } catch (err) {
    console.error('Neon connection error:', err);
  } finally {
    await pool.end();
  }
}

main();
