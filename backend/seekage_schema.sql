-- ═══════════════════════════════════════════════════════════════════════════
-- SEEKAGE DATABASE SCHEMA
-- Run this in MySQL Workbench to set up all tables
-- ═══════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS seekage_db;
USE seekage_db;

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE Users (
  user_id          INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  role             ENUM('admin','student','parent','teacher','counselor','psychologist','school') NOT NULL,
  phone_number     VARCHAR(15) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  parent_password  VARCHAR(255) DEFAULT NULL,  -- Set by admin; used for hide/unhide
  age              INT DEFAULT NULL,
  state            VARCHAR(50) DEFAULT NULL,
  preferred_language ENUM('en','ml') DEFAULT 'en',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Schools ─────────────────────────────────────────────────────────────────
CREATE TABLE Schools (
  school_id   INT AUTO_INCREMENT PRIMARY KEY,
  school_code VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  place       VARCHAR(100) NOT NULL
);

-- ─── Study Groups ─────────────────────────────────────────────────────────────
CREATE TABLE Study_Groups (
  group_id      INT AUTO_INCREMENT PRIMARY KEY,
  group_type    ENUM('age_based','school_based') NOT NULL,
  group_name    VARCHAR(100) NOT NULL,
  school_id     INT DEFAULT NULL,
  student_count INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES Schools(school_id) ON DELETE SET NULL
);

-- ─── Content ──────────────────────────────────────────────────────────────────
CREATE TABLE Content (
  content_id         INT AUTO_INCREMENT PRIMARY KEY,
  group_id           INT,
  uploader_id        INT,
  content_type       ENUM('video','document','note','assignment') NOT NULL,
  subject_name       VARCHAR(100) DEFAULT NULL,
  title              VARCHAR(200) NOT NULL,
  file_url           VARCHAR(500) NOT NULL,
  is_hidden_by_parent BOOLEAN DEFAULT FALSE,
  uploaded_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id)    REFERENCES Study_Groups(group_id) ON DELETE SET NULL,
  FOREIGN KEY (uploader_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- ─── Q&A ──────────────────────────────────────────────────────────────────────
CREATE TABLE QA_Questions (
  question_id   INT AUTO_INCREMENT PRIMARY KEY,
  group_id      INT NOT NULL,
  asker_id      INT NOT NULL,
  question_text TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES Study_Groups(group_id),
  FOREIGN KEY (asker_id) REFERENCES Users(user_id)
);

CREATE TABLE QA_Answers (
  answer_id    INT AUTO_INCREMENT PRIMARY KEY,
  question_id  INT NOT NULL,
  answerer_id  INT NOT NULL,
  answer_text  TEXT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id)  REFERENCES QA_Questions(question_id),
  FOREIGN KEY (answerer_id)  REFERENCES Users(user_id)
);

-- ─── Chat Messages ────────────────────────────────────────────────────────────
CREATE TABLE Messages (
  message_id   INT AUTO_INCREMENT PRIMARY KEY,
  group_id     INT NOT NULL,
  sender_id    INT NOT NULL,
  message_text TEXT NOT NULL,
  sent_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id)  REFERENCES Study_Groups(group_id),
  FOREIGN KEY (sender_id) REFERENCES Users(user_id)
);

-- ─── Seed: Default Admin ──────────────────────────────────────────────────────
-- Password: admin123  (bcrypt hash — change in production!)
INSERT INTO Users (name, role, phone_number, password_hash)
VALUES ('Super Admin', 'admin', '9999999999',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ─── Seed: Sample School ─────────────────────────────────────────────────────
INSERT INTO Schools (school_code, name, place)
VALUES ('GHS2024', 'Government High School', 'Thiruvananthapuram');

-- ─── Seed: Sample Age-Based Groups ───────────────────────────────────────────
INSERT INTO Study_Groups (group_type, group_name) VALUES
  ('age_based', 'Age 8-9 Batch A'),
  ('age_based', 'Age 10-11 Batch A'),
  ('age_based', 'Age 12-13 Batch A'),
  ('age_based', 'Age 14-15 Batch A');

-- ─── Seed: Sample School Group ───────────────────────────────────────────────
INSERT INTO Study_Groups (group_type, group_name, school_id) VALUES
  ('school_based', 'Class 8A', 1),
  ('school_based', 'Class 9B', 1),
  ('school_based', 'Class 10A', 1);
