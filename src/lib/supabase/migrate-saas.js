const { Client } = require("pg");

const connectionString = "postgres://postgres.vidahzporaivvfurnesx:ilVhbRS2vOEE1NTa@aws-1-eu-north-1.pooler.supabase.com:5432/postgres";

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("🔄 Connecting to Supabase PostgreSQL database...");
    await client.connect();
    console.log("✅ Connected successfully!");

    // 1. Enable extensions
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2. Update institutions table
    console.log("- Updating institutions table...");
    await client.query(`
      ALTER TABLE institutions 
      ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS admin_password VARCHAR(255);
    `);

    // 3. Update courses table
    console.log("- Updating courses table...");
    await client.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS cover_image TEXT,
      ADD COLUMN IF NOT EXISTS lecture_url TEXT DEFAULT 'https://meet.google.com/abc-defg-hij',
      ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT DEFAULT 'https://chat.whatsapp.com/G1x2y3z4';
    `);

    // 4. Update flashcards table
    console.log("- Updating flashcards table...");
    await client.query(`
      ALTER TABLE flashcards 
      ADD COLUMN IF NOT EXISTS lecture_number INT DEFAULT 1;
    `);

    // 5. Create quizzes table
    console.log("- Creating quizzes table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        lecture_number INT NOT NULL,
        question TEXT NOT NULL,
        options TEXT[] NOT NULL,
        correct_option INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    // 6. Create students table
    console.log("- Creating students table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        avatar_url TEXT,
        national_id VARCHAR(14) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        roll_number INT,
        whatsapp_group_url TEXT,
        lecture_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    // 7. Create/Update applications table
    console.log("- Creating/Updating applications table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        national_id VARCHAR(14) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
      ALTER TABLE applications ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;
    `);

    // 8. Create self_evaluations table
    console.log("- Creating self_evaluations table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS self_evaluations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        lecture_number INT NOT NULL,
        understanding_rating INT NOT NULL,
        effort_rating INT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    // 9. Create quiz_scores table
    console.log("- Creating quiz_scores table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_scores (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        lecture_number INT NOT NULL,
        score INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    console.log("🚀 SaaS Database schema migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await client.end();
    console.log("🔌 Connection closed.");
  }
}

runMigration();
