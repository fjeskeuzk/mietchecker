// API route to trigger data ingestion for a project
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchAllOSMMetrics } from '@/lib/osm';
import { fetchAllCityMetrics } from '@/lib/cityData';
import { normalizeMetric, calculateOverallScore, METRIC_CONFIGS } from '@/lib/score';
import { MetricKey } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.latitude || !project.longitude) {
      return NextResponse.json(
        { error: 'Project must have coordinates for data ingestion' },
        { status: 400 }
      );
    }

    // Create ingestion job
    const { data: job } = await supabaseAdmin
      .from('ingestion_jobs')
      .insert({
        project_id: projectId,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Fetch data from OSM and city sources
    try {
      const [osmData, cityData] = await Promise.all([
        fetchAllOSMMetrics(project.latitude, project.longitude),
        fetchAllCityMetrics(project.latitude, project.longitude),
      ]);

      // Insert metrics
      const metricsToInsert = [];
      const normalizedScores: Record<string, number> = {};

      // OSM metrics
      if (osmData.grocery_stores) {
        const score = normalizeMetric(osmData.grocery_stores.count, METRIC_CONFIGS.grocery_stores);
        normalizedScores.grocery_stores = score;
        metricsToInsert.push({
          project_id: projectId,
          metric_key: 'grocery_stores',
          metric_value: osmData.grocery_stores.count,
          normalized_score: score,
          raw: { ...osmData.grocery_stores, pois: osmData.grocery_stores.pois.slice(0, 10) },
          source: 'osm',
        });
      }

      if (osmData.laundromats) {
        const score = normalizeMetric(osmData.laundromats.count, METRIC_CONFIGS.laundromats);
        normalizedScores.laundromats = score;
        metricsToInsert.push({
          project_id: projectId,
          metric_key: 'laundromats',
          metric_value: osmData.laundromats.count,
          normalized_score: score,
          raw: osmData.laundromats,
          source: 'osm',
        });
      }

      if (osmData.parking) {
        const score = normalizeMetric(osmData.parking.count, METRIC_CONFIGS.parking);
        normalizedScores.parking = score;
        metricsToInsert.push({
          project_id: projectId,
          metric_key: 'parking',
          metric_value: osmData.parking.count,
          normalized_score: score,
          raw: osmData.parking,
          source: 'osm',
        });
      }

      if (osmData.light) {
        const score = normalizeMetric(osmData.light.level, METRIC_CONFIGS.light);
        normalizedScores.light = score;
        metricsToInsert.push({
          project_id: projectId,
          metric_key: 'light',
          metric_value: osmData.light.level,
          normalized_score: score,
          raw: osmData.light,
          source: 'osm',
        });
      }

      // City metrics
      if (cityData) {
        if (cityData.crime !== null) {
          const score = normalizeMetric(cityData.crime, METRIC_CONFIGS.crime);
          normalizedScores.crime = score;
          metricsToInsert.push({
            project_id: projectId,
            metric_key: 'crime',
            metric_value: cityData.crime,
            normalized_score: score,
            raw: { value: cityData.crime, city: cityData.city },
            source: `city_of_${cityData.city.toLowerCase()}_open_data`,
          });
        }

        if (cityData.noise !== null) {
          const score = normalizeMetric(cityData.noise, METRIC_CONFIGS.noise);
          normalizedScores.noise = score;
          metricsToInsert.push({
            project_id: projectId,
            metric_key: 'noise',
            metric_value: cityData.noise,
            normalized_score: score,
            raw: { value: cityData.noise, city: cityData.city },
            source: `city_of_${cityData.city.toLowerCase()}_open_data`,
          });
        }

        if (cityData.internet_speed !== null) {
          const score = normalizeMetric(cityData.internet_speed, METRIC_CONFIGS.internet_speed);
          normalizedScores.internet_speed = score;
          metricsToInsert.push({
            project_id: projectId,
            metric_key: 'internet_speed',
            metric_value: cityData.internet_speed,
            normalized_score: score,
            raw: { value: cityData.internet_speed, city: cityData.city },
            source: `city_of_${cityData.city.toLowerCase()}_open_data`,
          });
        }

        if (cityData.demographics !== null) {
          const score = normalizeMetric(cityData.demographics, METRIC_CONFIGS.demographics);
          normalizedScores.demographics = score;
          metricsToInsert.push({
            project_id: projectId,
            metric_key: 'demographics',
            metric_value: cityData.demographics,
            normalized_score: score,
            raw: { value: cityData.demographics, city: cityData.city },
            source: `city_of_${cityData.city.toLowerCase()}_open_data`,
          });
        }
      }

      // Insert all metrics
      if (metricsToInsert.length > 0) {
        await supabaseAdmin.from('project_metrics').insert(metricsToInsert);
      }

      // Calculate overall score
      const overallScore = calculateOverallScore(normalizedScores as Record<MetricKey, number>);

      // Update project with overall score
      await supabaseAdmin
        .from('projects')
        .update({ overall_score: overallScore })
        .eq('id', projectId);

      // Update job status
      await supabaseAdmin
        .from('ingestion_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          metadata: {
            metrics_fetched: metricsToInsert.length,
            overall_score: overallScore,
          },
        })
        .eq('id', job?.id);

      return NextResponse.json({
        success: true,
        metrics_count: metricsToInsert.length,
        overall_score: overallScore,
      });
    } catch (error) {
      console.error('Ingestion error:', error);

      // Update job with error
      await supabaseAdmin
        .from('ingestion_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', job?.id);

      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
