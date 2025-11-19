#!/usr/bin/env node

/**
 * Seed script for local development
 * Creates sample projects and data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('Seeding Mietchecker database...\n');

  try {
    // Get first user (you'll need to create a user via Supabase Auth first)
    const { data: { users } } = await supabase.auth.admin.listUsers();

    if (!users || users.length === 0) {
      console.log('No users found. Please create a user first via Supabase Auth.');
      console.log('You can do this at: https://supabase.com/dashboard/project/_/auth/users');
      process.exit(1);
    }

    const userId = users[0].id;
    console.log(`Using user ID: ${userId}\n`);

    // Create sample projects
    console.log('Creating sample projects...');

    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          id: '11111111-1111-1111-1111-111111111111',
          owner_id: userId,
          title: 'Wohnung Berlin Mitte',
          address: 'Alexanderplatz 1, 10178 Berlin',
          latitude: 52.5200,
          longitude: 13.4050,
          overall_score: 78.5,
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          owner_id: userId,
          title: 'Apartment Hamburg Altona',
          address: 'Große Bergstraße 123, 22767 Hamburg',
          latitude: 53.5511,
          longitude: 9.9937,
          overall_score: 82.3,
        },
      ])
      .select();

    if (projectError) {
      console.warn('Projects may already exist:', projectError.message);
    } else {
      console.log(`✓ Created ${projects.length} sample projects\n`);
    }

    console.log('✓ Seeding complete!');
    console.log('\nSample projects:');
    console.log('1. Wohnung Berlin Mitte (Berlin)');
    console.log('2. Apartment Hamburg Altona (Hamburg)');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
