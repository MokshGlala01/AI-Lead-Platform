-- ========================================================================
-- DATABASE TRIGGER: AUTOMATED ROUND-ROBIN COUNSELOR ASSIGNMENT
-- ========================================================================
-- Description:
-- Automatically assigns an available admissions counselor to a newly inserted
-- student lead record, increments counselor workload, and logs the action
-- directly in the PostgreSQL database.
-- ========================================================================

-- 1. BEFORE INSERT: Assign counselor and set status
CREATE OR REPLACE FUNCTION assign_counselor_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  selected_counselor RECORD;
BEGIN
  -- Only assign a counselor if counselor_id is not already provided
  IF NEW.counselor_id IS NULL THEN
    -- Fetch the available counselor with the minimum total_assigned tally
    SELECT id, name, total_assigned 
    INTO selected_counselor
    FROM counselors
    WHERE is_available = true
    ORDER BY total_assigned ASC, created_at ASC
    LIMIT 1;

    -- If an available counselor is found
    IF FOUND THEN
      -- Link the counselor and auto-promote status to Qualified
      NEW.counselor_id := selected_counselor.id;
      NEW.status := 'Qualified';

      -- Increment the counselor workload counter
      UPDATE counselors
      SET total_assigned = total_assigned + 1
      WHERE id = selected_counselor.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the BEFORE INSERT trigger to the leads table
DROP TRIGGER IF EXISTS tr_assign_counselor_before ON leads;
CREATE TRIGGER tr_assign_counselor_before
BEFORE INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION assign_counselor_on_insert();


-- 2. AFTER INSERT: Log the assignment to lead_activity
CREATE OR REPLACE FUNCTION log_counselor_assignment_activity()
RETURNS TRIGGER AS $$
DECLARE
  counselor_name TEXT;
BEGIN
  -- If a counselor is linked, log the activity
  IF NEW.counselor_id IS NOT NULL THEN
    -- Get the counselor name for descriptive log auditing
    SELECT name INTO counselor_name
    FROM counselors
    WHERE id = NEW.counselor_id;

    -- Insert activity audit log
    INSERT INTO lead_activity (lead_id, activity_type, description)
    VALUES (
      NEW.id,
      'counselor_assigned',
      'Automated round-robin database trigger assignment: matched to coordinator ' || COALESCE(counselor_name, 'Counselor')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the AFTER INSERT trigger to the leads table
DROP TRIGGER IF EXISTS tr_assign_counselor_after ON leads;
CREATE TRIGGER tr_assign_counselor_after
AFTER INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION log_counselor_assignment_activity();
