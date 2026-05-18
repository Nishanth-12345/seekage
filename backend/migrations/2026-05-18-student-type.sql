USE seekage_db;

ALTER TABLE Students
  ADD COLUMN type ENUM('seekage','school') NOT NULL DEFAULT 'seekage' AFTER password_hash;

UPDATE Students
SET type = 'school'
WHERE school_id IS NOT NULL;
