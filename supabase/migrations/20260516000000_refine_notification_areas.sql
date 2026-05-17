ALTER TABLE public.intelligence_notification_preferences
  ALTER COLUMN areas SET DEFAULT ARRAY[
    'goal_progress',
    'pipeline_revenue',
    'execution',
    'customer_health',
    'critical_risks'
  ]::text[];

WITH normalized AS (
  SELECT
    user_id,
    ARRAY(
      SELECT DISTINCT mapped_area
      FROM (
        SELECT CASE area
          WHEN 'goal_progress' THEN 'goal_progress'
          WHEN 'pipeline_revenue' THEN 'pipeline_revenue'
          WHEN 'revenue' THEN 'pipeline_revenue'
          WHEN 'connectors' THEN 'pipeline_revenue'
          WHEN 'execution' THEN 'execution'
          WHEN 'operations' THEN 'execution'
          WHEN 'people' THEN 'execution'
          WHEN 'customer_health' THEN 'customer_health'
          WHEN 'customer_experience' THEN 'customer_health'
          WHEN 'critical_risks' THEN 'critical_risks'
          ELSE NULL
        END AS mapped_area
        FROM unnest(COALESCE(areas, ARRAY[]::text[])) AS area
      ) mapped
      WHERE mapped_area IS NOT NULL
    ) AS next_areas
  FROM public.intelligence_notification_preferences
)
UPDATE public.intelligence_notification_preferences prefs
SET areas = CASE
  WHEN COALESCE(array_length(normalized.next_areas, 1), 0) > 0 THEN normalized.next_areas
  ELSE ARRAY[
    'goal_progress',
    'pipeline_revenue',
    'execution',
    'customer_health',
    'critical_risks'
  ]::text[]
END,
updated_at = now()
FROM normalized
WHERE normalized.user_id = prefs.user_id;
