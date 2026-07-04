-- ========================================================================
-- DATABASE MIGRATION: ADD AI RECOMMENDATION COLUMN
-- ========================================================================
-- Description:
-- Adds a column to the leads table to store the personalized AI recommendation
-- analysis generated during automated scoring.
-- ========================================================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS ai_recommendation TEXT DEFAULT 'Admissions review pending.';
