-- ========================================================================
-- DATABASE MIGRATION: ADD STUDENT DOCUMENT COLUMNS
-- ========================================================================
-- Description:
-- Adds columns to the leads table to store the URLs of uploaded documents
-- (10th marksheet, 12th marksheet, Aadhaar ID, passport photo).
-- ========================================================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS document_10th VARCHAR(500),
ADD COLUMN IF NOT EXISTS document_12th VARCHAR(500),
ADD COLUMN IF NOT EXISTS document_aadhaar VARCHAR(500),
ADD COLUMN IF NOT EXISTS document_photo VARCHAR(500);
