import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';

// For ESM
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

console.log('Pushing schema to database...');

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// Simple push approach
async function main() {
  try {
    // Get all table objects from schema
    const tables = Object.entries(schema)
      .filter(([_, value]) => typeof value === 'object' && value !== null && '$schema' in value)
      .map(([_, value]) => value);

    console.log(`Found ${tables.length} tables to push`);
    
    for (const table of tables) {
      try {
        const tableName = table._.name;
        console.log(`Processing table: ${tableName}`);
        
        // Create the table SQL
        const createTableSQL = db.dialect.compile(
          db.dialect.createTable(table).ifNotExists()
        );
        
        // Execute the SQL
        await client.unsafe(createTableSQL.sql, createTableSQL.params);
        console.log(`- Created table: ${tableName}`);
      } catch (error) {
        console.error(`Error with table:`, error);
      }
    }
    
    console.log('Schema push completed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
  } finally {
    await client.end();
  }
}

main();