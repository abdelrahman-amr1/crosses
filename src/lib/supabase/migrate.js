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

    console.log("🔄 Running schema migrations...");

    // 1. Alter courses table
    console.log("- Updating courses table...");
    await client.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS lecture_url TEXT DEFAULT 'https://meet.google.com/abc-defg-hij',
      ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT DEFAULT 'https://chat.whatsapp.com/G1x2y3z4';
    `);

    // 2. Alter profiles table
    console.log("- Updating profiles (students) table...");
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS national_id VARCHAR(14),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS roll_number INT,
      ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT,
      ADD COLUMN IF NOT EXISTS lecture_url TEXT;
    `);

    // 3. Create applications table
    console.log("- Creating applications table...");
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
    `);

    // 4. Seed initial default institution (center1) and courses if empty
    console.log("- Seeding initial data...");
    
    // Check if center1 exists
    const instCheck = await client.query("SELECT id FROM institutions WHERE subdomain = 'center1' LIMIT 1;");
    let institutionId;
    if (instCheck.rows.length === 0) {
      const instInsert = await client.query(`
        INSERT INTO institutions (name, subdomain)
        VALUES ('مركز التعليم الأول', 'center1')
        RETURNING id;
      `);
      institutionId = instInsert.rows[0].id;
      console.log(`💡 Created default institution 'center1' with ID: ${institutionId}`);
    } else {
      institutionId = instCheck.rows[0].id;
      console.log(`💡 Found existing institution 'center1' with ID: ${institutionId}`);
    }

    // Check if courses exist
    const courseCheck = await client.query("SELECT id FROM courses LIMIT 1;");
    if (courseCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO courses (id, institution_id, title, description, price, lectures_count, lecture_url, whatsapp_group_url)
        VALUES 
          ('00000000-0000-0000-0000-000000000001', '${institutionId}', 'دورة تطوير الويب الشامل', 'تعلم HTML, CSS, JavaScript, React & Next.js من الصفر للاحتراف.', 500.00, 12, 'https://meet.google.com/abc-defg-hij', 'https://chat.whatsapp.com/G1x2y3z4'),
          ('00000000-0000-0000-0000-000000000002', '${institutionId}', 'دورة التسويق الرقمي', 'إتقان الإعلانات الممولة، السيو، وكتابة المحتوى التسويقي.', 350.00, 8, 'https://zoom.us/j/9876543210', 'https://chat.whatsapp.com/H5w6x7y8');
      `);
      console.log("💡 Seeded default courses: Web Development & Digital Marketing.");
    }

    console.log("🚀 Database schema migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await client.end();
    console.log("🔌 Connection closed.");
  }
}

runMigration();
