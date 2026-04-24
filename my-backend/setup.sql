-- Connect to a different database
\connect template1;

-- Drop database if it exists
DROP DATABASE IF EXISTS vigilkura;

-- Create database
CREATE DATABASE vigilkura;

-- Drop the test database if it exists
DROP DATABASE IF EXISTS vigilkura_test;

-- Create the test database
CREATE DATABASE vigilkura_test;

-- Connect to database
\connect vigilkura;

-- Apply the schema
\i schema.sql;

-- Insert seed data
\i seed.sql;
