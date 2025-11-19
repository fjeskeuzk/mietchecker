-- Mietchecker Seed Data
-- Sample data for local development and testing

-- Note: This assumes you have created test users via Supabase Auth
-- For local dev, use these test user IDs (replace with actual UUIDs from your local Supabase)

-- Insert sample user profiles (use actual auth.users IDs)
-- You'll need to create these users first via Supabase Auth UI or API

-- Sample Project 1: Berlin Mitte
INSERT INTO projects (id, owner_id, title, address, latitude, longitude, overall_score, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  (SELECT id FROM auth.users LIMIT 1), -- Use first available user
  'Wohnung Berlin Mitte',
  'Alexanderplatz 1, 10178 Berlin',
  52.5200,
  13.4050,
  78.5,
  now() - interval '7 days'
) ON CONFLICT (id) DO NOTHING;

-- Sample Project 2: Hamburg Altona
INSERT INTO projects (id, owner_id, title, address, latitude, longitude, overall_score, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  (SELECT id FROM auth.users LIMIT 1),
  'Apartment Hamburg Altona',
  'Große Bergstraße 123, 22767 Hamburg',
  53.5511,
  9.9937,
  82.3,
  now() - interval '3 days'
) ON CONFLICT (id) DO NOTHING;

-- Sample metrics for Berlin project
INSERT INTO project_metrics (project_id, metric_key, metric_value, normalized_score, raw, source, fetched_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'noise',
    65.5,
    72.0,
    '{"db_level": 65.5, "source": "city_dataset", "measurement_type": "average"}'::jsonb,
    'city_of_berlin_open_data',
    now() - interval '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'light',
    3.2,
    68.0,
    '{"brightness_level": 3.2, "scale": "bortle", "description": "suburban"}'::jsonb,
    'osm',
    now() - interval '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'crime',
    12.5,
    87.5,
    '{"incidents_per_1000": 12.5, "year": 2024, "category": "all"}'::jsonb,
    'city_of_berlin_open_data',
    now() - interval '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'internet_speed',
    250.0,
    95.0,
    '{"download_mbps": 250, "upload_mbps": 50, "provider": "multiple"}'::jsonb,
    'city_of_berlin_open_data',
    now() - interval '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'demographics',
    35.0,
    75.0,
    '{"avg_age": 35, "families_percentage": 45, "singles_percentage": 55}'::jsonb,
    'city_of_berlin_open_data',
    now() - interval '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'grocery_stores',
    8.0,
    90.0,
    '{"count": 8, "radius_m": 500, "types": ["supermarket", "organic", "discount"]}'::jsonb,
    'osm',
    now() - interval '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'laundromats',
    2.0,
    60.0,
    '{"count": 2, "radius_m": 1000}'::jsonb,
    'osm',
    now() - interval '1 day'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'parking',
    4.0,
    65.0,
    '{"public_spots": 4, "street_parking": "limited", "parking_garages": 2}'::jsonb,
    'osm',
    now() - interval '1 day'
  )
ON CONFLICT DO NOTHING;

-- Sample metrics for Hamburg project
INSERT INTO project_metrics (project_id, metric_key, metric_value, normalized_score, raw, source, fetched_at)
VALUES
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'noise',
    58.0,
    82.0,
    '{"db_level": 58.0, "source": "city_dataset", "measurement_type": "average"}'::jsonb,
    'city_of_hamburg_open_data',
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'light',
    2.5,
    75.0,
    '{"brightness_level": 2.5, "scale": "bortle", "description": "rural_suburban"}'::jsonb,
    'osm',
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'crime',
    8.2,
    91.8,
    '{"incidents_per_1000": 8.2, "year": 2024, "category": "all"}'::jsonb,
    'city_of_hamburg_open_data',
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'internet_speed',
    300.0,
    98.0,
    '{"download_mbps": 300, "upload_mbps": 60, "provider": "multiple"}'::jsonb,
    'city_of_hamburg_open_data',
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'demographics',
    32.0,
    78.0,
    '{"avg_age": 32, "families_percentage": 55, "singles_percentage": 45}'::jsonb,
    'city_of_hamburg_open_data',
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'grocery_stores',
    12.0,
    95.0,
    '{"count": 12, "radius_m": 500, "types": ["supermarket", "organic", "discount", "local"]}'::jsonb,
    'osm',
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'laundromats',
    3.0,
    75.0,
    '{"count": 3, "radius_m": 1000}'::jsonb,
    'osm',
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'parking',
    6.0,
    80.0,
    '{"public_spots": 6, "street_parking": "moderate", "parking_garages": 3}'::jsonb,
    'osm',
    now() - interval '1 day'
  )
ON CONFLICT DO NOTHING;

-- Sample conversation for Berlin project
INSERT INTO conversations (project_id, user_id, role, message, created_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    (SELECT id FROM auth.users LIMIT 1),
    'user',
    'Wie ist die Lärmbelastung in dieser Gegend?',
    now() - interval '2 hours'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    (SELECT id FROM auth.users LIMIT 1),
    'assistant',
    'Die Lärmbelastung in der Gegend um Alexanderplatz liegt bei etwa 65,5 dB (basierend auf Daten der Stadt Berlin, abgerufen am ' ||
    to_char(now() - interval '1 day', 'YYYY-MM-DD') || '). Dies entspricht einem normalisierten Score von 72/100.\n\n' ||
    'Bewertung: Dies ist ein moderater Lärmpegel, typisch für zentrale städtische Lagen. Hauptverkehrsstraßen und öffentliche Verkehrsmittel tragen zur Geräuschkulisse bei.\n\n' ||
    'Empfehlungen:\n' ||
    '- Besichtigen Sie die Wohnung zu verschiedenen Tageszeiten\n' ||
    '- Prüfen Sie die Schalldämmung der Fenster\n' ||
    '- Erkundigen Sie sich nach ruhigeren Räumen zur Hofseite\n' ||
    '- Beachten Sie Nachtruhezeiten und Verkehrsanbindungen',
    now() - interval '2 hours' + interval '30 seconds'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    (SELECT id FROM auth.users LIMIT 1),
    'user',
    'Was gibt es für Einkaufsmöglichkeiten in der Nähe?',
    now() - interval '1 hour'
  ),
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    (SELECT id FROM auth.users LIMIT 1),
    'assistant',
    'In einem Radius von 500 Metern finden Sie 8 Lebensmittelgeschäfte (Daten von OpenStreetMap, Score: 90/100). Das ist eine ausgezeichnete Versorgungslage!\n\n' ||
    'Verfügbare Geschäftstypen:\n' ||
    '- Supermärkte (Edeka, REWE)\n' ||
    '- Bio-Läden\n' ||
    '- Discounter (Aldi, Lidl)\n\n' ||
    'Diese zentrale Lage bietet Ihnen eine hervorragende Infrastruktur für den täglichen Bedarf. Die Vielfalt ermöglicht flexible Einkaufsmöglichkeiten zu verschiedenen Preislagen.',
    now() - interval '1 hour' + interval '45 seconds'
  )
ON CONFLICT DO NOTHING;

-- Sample ingestion job
INSERT INTO ingestion_jobs (project_id, status, started_at, completed_at, metadata)
VALUES
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'completed',
    now() - interval '1 day' - interval '5 minutes',
    now() - interval '1 day',
    '{"metrics_fetched": 8, "sources": ["osm", "city_of_berlin_open_data"]}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'completed',
    now() - interval '1 day' - interval '4 minutes',
    now() - interval '1 day',
    '{"metrics_fetched": 8, "sources": ["osm", "city_of_hamburg_open_data"]}'::jsonb
  )
ON CONFLICT DO NOTHING;
