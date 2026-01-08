-- Seed Users Script
-- Generated: 2026-01-08T14:03:15.876Z
-- Default password for all users: "Test123!"
-- Access Levels: 1=Admin, 2=UW Team Lead, 3=Head of UW, 4=Underwriter, 5=Product Team

-- IMPORTANT: Change passwords immediately in production!

-- Clear existing test users (optional - uncomment if needed)
-- DELETE FROM users WHERE email LIKE '%@test.com';

-- Insert test users
INSERT INTO users (email, password_hash, name, access_level, is_active) VALUES
('admin@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Admin User', 1, true),
('john.admin@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'John Admin', 1, true),
('teamlead@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Team Lead User', 2, true),
('sarah.lead@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Sarah Team Lead', 2, true),
('headofuw@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Head of UW', 3, true),
('mike.head@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Mike Head', 3, true),
('underwriter@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Underwriter User', 4, true),
('jane.uw@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Jane Underwriter', 4, true),
('bob.uw@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Bob Underwriter', 4, true),
('product@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Product User', 5, true),
('alex.product@test.com', '$2b$10$XkwNRyzKf69gEeFdzdzMjez0Dr9i.A1VHblBimQSsBaS6vOc974YK', 'Alex Product', 5, true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  access_level = EXCLUDED.access_level,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify users were created
SELECT id, email, name, access_level, is_active, created_at FROM users ORDER BY access_level, email;
