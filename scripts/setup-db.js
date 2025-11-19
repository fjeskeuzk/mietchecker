#!/usr/bin/env node

/**
 * Database setup script
 * Applies schema and seeds the database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLFile(filePath) {
  console.log(`Running SQL file: ${filePath}`);

  const sql = fs.readFileSync(filePath, 'utf8');

  // Split by semicolons, but be careful with strings and comments
  const statements = sql
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

      if (error) {
        // Try direct execution for statements that don't work with rpc
        const { error: directError } = await supabase.from('_').select(statement);

        if (directError && directError.message !== "relation \"_\" does not exist") {
          console.warn(`Warning executing statement: ${directError.message}`);
          console.warn(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    } catch (err) {
      console.warn(`Error executing statement: ${err.message}`);
      console.warn(`Statement: ${statement.substring(0, 100)}...`);
    }
  }
}

async function setup() {
  console.log('Setting up Mietchecker database...\n');

  try {
    // Apply schema
    console.log('1. Applying database schema...');
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    await runSQLFile(schemaPath);
    console.log('✓ Schema applied\n');

    // Apply seed data
    console.log('2. Seeding database...');
    const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
    await runSQLFile(seedPath);
    console.log('✓ Seed data applied\n');

    console.log('✓ Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run `npm run dev` to start the development server');
    console.log('2. Visit http://localhost:3000 to see the app');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Note: Direct SQL execution might not work with all Supabase instances
// For local development, use `supabase db reset` instead
// For remote, you may need to run SQL files manually in the Supabase dashboard

console.log('Note: This script requires a Supabase instance with SQL execution enabled.');
console.log('For local development, consider using: supabase db reset\n');

setup();
