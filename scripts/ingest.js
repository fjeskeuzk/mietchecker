#!/usr/bin/env node

/**
 * Data ingestion script
 * Fetches property data from OSM and city sources
 *
 * Usage:
 *   node scripts/ingest.js --lat=52.5200 --lon=13.4050 --projectId=xxx
 *   node scripts/ingest.js --projectId=xxx (uses project's stored coordinates)
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

// Parse command line arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value;
  });
  return args;
}

async function ingest() {
  const args = parseArgs();

  let { lat, lon, projectId } = args;

  if (!projectId) {
    console.error('Error: --projectId is required');
    console.log('Usage: node scripts/ingest.js --projectId=xxx [--lat=52.52 --lon=13.40]');
    process.exit(1);
  }

  console.log(`Fetching data for project: ${projectId}\n`);

  // If no coordinates provided, fetch from project
  if (!lat || !lon) {
    const { data: project, error } = await supabase
      .from('projects')
      .select('latitude, longitude, title')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      console.error('Error: Project not found');
      process.exit(1);
    }

    lat = project.latitude;
    lon = project.longitude;

    console.log(`Using coordinates from project "${project.title}":`);
    console.log(`  Latitude: ${lat}`);
    console.log(`  Longitude: ${lon}\n`);
  } else {
    lat = parseFloat(lat);
    lon = parseFloat(lon);
  }

  if (!lat || !lon) {
    console.error('Error: Project must have coordinates');
    process.exit(1);
  }

  console.log('Starting data ingestion...\n');

  try {
    // Create ingestion job
    const { data: job } = await supabase
      .from('ingestion_jobs')
      .insert({
        project_id: projectId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    console.log(`Created ingestion job: ${job.id}\n`);

    // Call the ingestion API endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/projects/${projectId}/ingest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();

    console.log('✓ Data ingestion complete!');
    console.log(`\nResults:`);
    console.log(`  Metrics fetched: ${result.metrics_count}`);
    console.log(`  Overall score: ${result.overall_score}/100`);
  } catch (error) {
    console.error('Error during ingestion:', error);
    process.exit(1);
  }
}

ingest();
