const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');
const schema = require('./shared/schema');

console.log('Pushing schema to database...');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// Simple push approach
async function main() {
  try {
    // Extract all table objects from schema
    const tables = Object.entries(schema)
      .filter(([key, value]) => typeof value === 'object' && value !== null && '$schema' in value)
      .map(([_, value]) => value);

    console.log(`Found ${tables.length} tables to push`);
    
    // For each table, create it if it doesn't exist
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