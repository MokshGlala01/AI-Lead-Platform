-- ========================================================================
-- DATABASE SCRIPT: RETROACTIVELY ASSIGN COUNSELORS TO EXISTING LEADS
-- ========================================================================
-- Description:
-- Loops through all existing student lead records in the database where
-- counselor_id is currently NULL. Performs a round-robin assignment for
-- each one using available counselors, updates counselor workloads,
-- and inserts audit logs in lead_activity.
-- ========================================================================

DO $$
DECLARE
  lead_record RECORD;
  selected_counselor RECORD;
BEGIN
  -- Loop through all existing leads who do not have a counselor assigned yet
  FOR lead_record IN 
    SELECT id, name 
    FROM leads 
    WHERE counselor_id IS NULL 
    ORDER BY created_at ASC
  LOOP
    -- Find the available counselor with the minimum workload
    SELECT id, name, total_assigned 
    INTO selected_counselor
    FROM counselors
    WHERE is_available = true
    ORDER BY total_assigned ASC, created_at ASC
    LIMIT 1;

    -- If an available counselor is found
    IF FOUND THEN
      -- Link the counselor to the lead and promote status to Qualified
      UPDATE leads
      SET counselor_id = selected_counselor.id,
          status = 'Qualified'
      WHERE id = lead_record.id;

      -- Increment the counselor workload counter
      UPDATE counselors
      SET total_assigned = total_assigned + 1
      WHERE id = selected_counselor.id;

      -- Insert activity log
      INSERT INTO lead_activity (lead_id, activity_type, description)
      VALUES (
        lead_record.id,
        'counselor_assigned',
        'Retroactive database counselor assignment: matched to coordinator ' || selected_counselor.name
      );
      
      RAISE NOTICE 'Successfully assigned lead % (%) to counselor %', lead_record.id, lead_record.name, selected_counselor.name;
    ELSE
      RAISE WARNING 'No available counselors found to assign to lead % (%)', lead_record.id, lead_record.name;
      EXIT; -- Stop loop if no counselors are available at all
    END IF;
  END LOOP;
END;
$$;
