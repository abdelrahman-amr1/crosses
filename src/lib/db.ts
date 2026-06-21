// Simple database client connecting to Supabase PostgreSQL database via Next.js API Route

export interface Flashcard {
  id: string;
  courseId: string;
  lectureNumber: number;
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizQuestion {
  id: string;
  courseId: string;
  lectureNumber: number;
  question: string;
  options: string[];
  correctOption: number; // 0 to 3
}

export interface Student {
  id: string;
  name: string;
  email: string;
  courseId: string;
  avatarUrl?: string;
  nationalId: string;
  phone: string;
  rollNumber: number; // رقم الكشف في الكورس
  whatsappGroupUrl?: string;
  lectureUrl?: string;
}

export interface Application {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  courseId: string;
  photoUrl: string; // Base64 avatar
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Institution {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string;
  createdAt: string;
  adminEmail?: string;
  adminPassword?: string;
}

export interface SelfEvaluation {
  id: string;
  username: string;
  lectureNumber: number;
  understandingRating: number; // 1 to 5
  effortRating: number; // 1 to 5
  notes: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  institutionId: string;
  studentName: string;
  courseId: string;
  lectureNumber: number;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lecturesCount: number;
  price: number;
  currency?: string;
  coverImage?: string;
  imageFit?: 'cover' | 'contain';
  lectureUrl: string; // رابط المحاضرة القابل للتعديل
  whatsappGroupUrl: string; // رابط جروب الواتساب للدورة
  isAttendanceOpen: boolean;
  isFlashcardsOpen: boolean;
  isQuizOpen: boolean;
  isEvaluationOpen: boolean;
  isRegistrationOpen: boolean;
  lectureControls?: Record<number, LectureControl>;
}

export interface LectureControl {
  isAttendanceOpen: boolean;
  isFlashcardsOpen: boolean;
  isQuizOpen: boolean;
  isEvaluationOpen: boolean;
  isTasksOpen: boolean;
  taskDescription: string;
  taskFileUrl: string;
}

export interface StudentTask {
  id: string;
  courseId: string;
  lectureNumber: number;
  studentPhone: string;
  fileUrl: string;
  createdAt: string;
}

// Global base URL detection for absolute fetch calls during SSR
function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function runQuery(query: string, values?: any[]) {
  if (typeof window !== "undefined") {
    // Client-side fetch
    const res = await fetch("/api/db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, values })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Query failed");
    }
    return await res.json();
  } else {
    // Server-side direct pg Pool query
    const { Pool } = await import("pg");
    const connectionString = "postgres://postgres.vidahzporaivvfurnesx:ilVhbRS2vOEE1NTa@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";
    const globalAny = globalThis as any;
    if (!globalAny.dbPool) {
      globalAny.dbPool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        max: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });
    }
    const pool = globalAny.dbPool;
    const result = await pool.query(query, values || []);
    return { rows: result.rows, rowCount: result.rowCount };
  }
}

export const db = {
  // Institutions (المراكز والمدارس)
  getInstitutions: async (): Promise<Institution[]> => {
    const res = await runQuery(`
      SELECT 
        id, 
        name, 
        subdomain, 
        logo_url as "logoUrl", 
        created_at as "createdAt", 
        admin_email as "adminEmail", 
        admin_password as "adminPassword" 
      FROM institutions 
      ORDER BY created_at DESC;
    `);
    return res.rows;
  },
  
  saveInstitutions: async (list: Institution[]): Promise<void> => {
    for (const inst of list) {
      await runQuery(`
        UPDATE institutions 
        SET 
          name = $1, 
          subdomain = $2,
          logo_url = $3, 
          admin_email = $4, 
          admin_password = $5 
        WHERE id = $6;
      `, [inst.name, inst.subdomain, inst.logoUrl, inst.adminEmail, inst.adminPassword, inst.id]);
    }
  },
  
  addInstitution: async (
    name: string, 
    subdomain: string, 
    logoUrl?: string, 
    adminEmail?: string, 
    adminPassword?: string
  ): Promise<Institution> => {
    const cleanSubdomain = subdomain.trim().toLowerCase();
    const finalAdminEmail = adminEmail || `admin@${cleanSubdomain}.com`;
    const finalAdminPassword = adminPassword || `admin_${cleanSubdomain}`;
    
    const res = await runQuery(`
      INSERT INTO institutions (name, subdomain, logo_url, admin_email, admin_password) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING 
        id, 
        name, 
        subdomain, 
        logo_url as "logoUrl", 
        created_at as "createdAt", 
        admin_email as "adminEmail", 
        admin_password as "adminPassword";
    `, [name, cleanSubdomain, logoUrl || null, finalAdminEmail, finalAdminPassword]);
    return res.rows[0];
  },
  
  deleteInstitution: async (id: string): Promise<void> => {
    // Delete related records first to avoid foreign key constraint violations
    await runQuery(`DELETE FROM student_tasks WHERE course_id IN (SELECT id FROM courses WHERE institution_id = $1);`, [id]);
    await runQuery(`DELETE FROM quiz_scores WHERE institution_id = $1;`, [id]);
    await runQuery(`DELETE FROM attendances WHERE institution_id = $1;`, [id]);
    await runQuery(`DELETE FROM flashcards WHERE institution_id = $1;`, [id]);
    await runQuery(`DELETE FROM courses WHERE institution_id = $1;`, [id]);
    await runQuery(`DELETE FROM students WHERE institution_id = $1;`, [id]);
    await runQuery(`DELETE FROM applications WHERE institution_id = $1;`, [id]);
    
    // Finally, delete the institution itself
    await runQuery(`DELETE FROM institutions WHERE id = $1;`, [id]);
  },

  // Courses
  getCourses: async (tenant: string): Promise<Course[]> => {
    const res = await runQuery(`
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.lectures_count as "lecturesCount", 
        c.price, 
        COALESCE(c.currency, 'ج.م') as "currency",
        c.cover_image as "coverImage", 
        COALESCE(c.image_fit, 'cover') as "imageFit",
        c.lecture_url as "lectureUrl", 
        c.whatsapp_group_url as "whatsappGroupUrl",
        COALESCE(c.is_attendance_open, true) as "isAttendanceOpen",
        COALESCE(c.is_flashcards_open, true) as "isFlashcardsOpen",
        COALESCE(c.is_quiz_open, true) as "isQuizOpen",
        COALESCE(c.is_evaluation_open, true) as "isEvaluationOpen",
        COALESCE(c.is_registration_open, true) as "isRegistrationOpen",
        c.lecture_controls as "lectureControls"
      FROM courses c
      JOIN institutions i ON c.institution_id = i.id
      WHERE i.subdomain = $1
      ORDER BY c.created_at ASC;
    `, [tenant]);
    return res.rows;
  },
  
  saveCourses: async (tenant: string, courses: Course[]): Promise<void> => {
    // 1. Get institution id
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) return;
    const instId = instRes.rows[0].id;

    // 2. Upsert courses
    const courseIds: string[] = [];
    for (const c of courses) {
      courseIds.push(c.id);
      await runQuery(`
        INSERT INTO courses (id, institution_id, title, description, price, currency, lectures_count, cover_image, image_fit, lecture_url, whatsapp_group_url, is_attendance_open, is_flashcards_open, is_quiz_open, is_evaluation_open, is_registration_open, lecture_controls)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          currency = EXCLUDED.currency,
          lectures_count = EXCLUDED.lectures_count,
          cover_image = EXCLUDED.cover_image,
          image_fit = EXCLUDED.image_fit,
          lecture_url = EXCLUDED.lecture_url,
          whatsapp_group_url = EXCLUDED.whatsapp_group_url,
          is_attendance_open = EXCLUDED.is_attendance_open,
          is_flashcards_open = EXCLUDED.is_flashcards_open,
          is_quiz_open = EXCLUDED.is_quiz_open,
          is_evaluation_open = EXCLUDED.is_evaluation_open,
          is_registration_open = EXCLUDED.is_registration_open,
          lecture_controls = EXCLUDED.lecture_controls;
      `, [
        c.id, instId, c.title, c.description, c.price, c.currency || 'ج.م', c.lecturesCount, c.coverImage || null, c.imageFit || 'cover', c.lectureUrl, c.whatsappGroupUrl,
        c.isAttendanceOpen !== false, c.isFlashcardsOpen !== false, c.isQuizOpen !== false, c.isEvaluationOpen !== false, c.isRegistrationOpen !== false,
        c.lectureControls ? JSON.stringify(c.lectureControls) : '{}'
      ]);
    }

    // 3. Delete courses not in the list for this institution
    if (courseIds.length > 0) {
      await runQuery(`
        DELETE FROM courses 
        WHERE institution_id = $1 AND NOT (id = ANY($2));
      `, [instId, courseIds]);
    } else {
      await runQuery(`
        DELETE FROM courses 
        WHERE institution_id = $1;
      `, [instId]);
    }
  },

  // Attendance
  saveAttendance: async (tenant: string, studentName: string, courseId: string, lectureNumber: number): Promise<void> => {
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) return;
    const instId = instRes.rows[0].id;
    
    // Use generateUUID logic on client side if needed, but since we are inside db.ts we can just let postgres generate it or we can pass an ID.
    // Actually we don't have crypto here. Let's use gen_random_uuid() from Postgres.
    await runQuery(`
      INSERT INTO attendances (id, institution_id, student_name, course_id, lecture_number)
      VALUES (gen_random_uuid(), $1, $2, $3, $4);
    `, [instId, studentName, courseId, lectureNumber]);
  },

  getAttendances: async (tenant: string, courseId: string, lectureNumber: number): Promise<AttendanceRecord[]> => {
    const res = await runQuery(`
      SELECT 
        a.id, 
        a.institution_id as "institutionId", 
        a.student_name as "studentName", 
        a.course_id as "courseId", 
        a.lecture_number as "lectureNumber", 
        a.created_at as "createdAt"
      FROM attendances a
      JOIN institutions i ON a.institution_id = i.id
      WHERE i.subdomain = $1 AND a.course_id = $2 AND a.lecture_number = $3
      ORDER BY a.created_at DESC;
    `, [tenant, courseId, lectureNumber]);
    return res.rows;
  },

  // Flashcards
  getFlashcards: async (tenant: string, courseId?: string, lectureNumber?: number): Promise<Flashcard[]> => {
    let sql = `
      SELECT 
        f.id, 
        f.course_id as "courseId", 
        f.lecture_number as "lectureNumber", 
        f.question, 
        f.answer, 
        f.difficulty
      FROM flashcards f
      JOIN courses c ON f.course_id = c.id
      JOIN institutions i ON c.institution_id = i.id
      WHERE i.subdomain = $1
    `;
    const params: any[] = [tenant];

    if (courseId) {
      params.push(courseId);
      sql += ` AND f.course_id = $${params.length}`;
    }
    if (lectureNumber !== undefined && lectureNumber > 0) {
      params.push(lectureNumber);
      sql += ` AND f.lecture_number = $${params.length}`;
    }

    sql += ` ORDER BY f.created_at ASC;`;
    
    const res = await runQuery(sql, params);
    return res.rows;
  },
  
  saveFlashcards: async (tenant: string, cards: Flashcard[]): Promise<void> => {
    // 1. Get institution id
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) return;
    const instId = instRes.rows[0].id;

    // 2. Upsert cards in parallel
    const cardIds = cards.map(c => c.id);
    await Promise.all(cards.map(c =>
      runQuery(`
        INSERT INTO flashcards (id, course_id, question, answer, difficulty, lecture_number)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          question = EXCLUDED.question,
          answer = EXCLUDED.answer,
          difficulty = EXCLUDED.difficulty,
          lecture_number = EXCLUDED.lecture_number;
      `, [c.id, c.courseId, c.question, c.answer, c.difficulty, c.lectureNumber || 1])
    ));

    // 3. Delete cards not in list for this institution's courses
    if (cardIds.length > 0) {
      await runQuery(`
        DELETE FROM flashcards 
        WHERE course_id IN (SELECT id FROM courses WHERE institution_id = $1)
        AND NOT (id = ANY($2));
      `, [instId, cardIds]);
    } else {
      await runQuery(`
        DELETE FROM flashcards 
        WHERE course_id IN (SELECT id FROM courses WHERE institution_id = $1);
      `, [instId]);
    }
  },

  // Quizzes
  getQuizzes: async (tenant: string, courseId?: string, lectureNumber?: number): Promise<QuizQuestion[]> => {
    let sql = `
      SELECT 
        q.id, 
        q.course_id as "courseId", 
        q.lecture_number as "lectureNumber", 
        q.question, 
        q.options, 
        q.correct_option as "correctOption"
      FROM quizzes q
      JOIN courses c ON q.course_id = c.id
      JOIN institutions i ON c.institution_id = i.id
      WHERE i.subdomain = $1
    `;
    const params: any[] = [tenant];

    if (courseId) {
      params.push(courseId);
      sql += ` AND q.course_id = $${params.length}`;
    }
    if (lectureNumber !== undefined && lectureNumber > 0) {
      params.push(lectureNumber);
      sql += ` AND q.lecture_number = $${params.length}`;
    }

    sql += ` ORDER BY q.created_at ASC;`;

    const res = await runQuery(sql, params);
    return res.rows;
  },
  
  saveQuizzes: async (tenant: string, quizzes: QuizQuestion[]): Promise<void> => {
    // 1. Get institution id
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) return;
    const instId = instRes.rows[0].id;

    // 2. Upsert quizzes in parallel
    const quizIds = quizzes.map(q => q.id);
    await Promise.all(quizzes.map(q =>
      runQuery(`
        INSERT INTO quizzes (id, course_id, question, options, correct_option, lecture_number)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          question = EXCLUDED.question,
          options = EXCLUDED.options,
          correct_option = EXCLUDED.correct_option,
          lecture_number = EXCLUDED.lecture_number;
      `, [q.id, q.courseId, q.question, q.options, q.correctOption, q.lectureNumber])
    ));

    // 3. Delete quizzes not in list for this institution's courses
    if (quizIds.length > 0) {
      await runQuery(`
        DELETE FROM quizzes 
        WHERE course_id IN (SELECT id FROM courses WHERE institution_id = $1)
        AND NOT (id = ANY($2));
      `, [instId, quizIds]);
    } else {
      await runQuery(`
        DELETE FROM quizzes 
        WHERE course_id IN (SELECT id FROM courses WHERE institution_id = $1);
      `, [instId]);
    }
  },

  // Students
  getStudents: async (tenant: string): Promise<Student[]> => {
    const res = await runQuery(`
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.course_id as "courseId", 
        s.avatar_url as "avatarUrl", 
        s.national_id as "nationalId", 
        s.phone, 
        s.roll_number as "rollNumber", 
        s.whatsapp_group_url as "whatsappGroupUrl", 
        s.lecture_url as "lectureUrl"
      FROM students s
      JOIN institutions i ON s.institution_id = i.id
      WHERE i.subdomain = $1
      ORDER BY s.roll_number ASC;
    `, [tenant]);
    return res.rows;
  },
  
  saveStudents: async (tenant: string, students: Student[]): Promise<void> => {
    // 1. Get institution id
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) return;
    const instId = instRes.rows[0].id;

    // 2. Upsert students in parallel
    const studentIds = students.map(s => s.id);
    await Promise.all(students.map(s =>
      runQuery(`
        INSERT INTO students (id, institution_id, name, email, course_id, avatar_url, national_id, phone, roll_number, whatsapp_group_url, lecture_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          course_id = EXCLUDED.course_id,
          avatar_url = EXCLUDED.avatar_url,
          national_id = EXCLUDED.national_id,
          phone = EXCLUDED.phone,
          roll_number = EXCLUDED.roll_number,
          whatsapp_group_url = EXCLUDED.whatsapp_group_url,
          lecture_url = EXCLUDED.lecture_url;
      `, [s.id, instId, s.name, s.email, s.courseId, s.avatarUrl || null, s.nationalId, s.phone, s.rollNumber, s.whatsappGroupUrl || null, s.lectureUrl || null])
    ));

    // 3. Delete students not in list for this institution
    if (studentIds.length > 0) {
      await runQuery(`
        DELETE FROM students 
        WHERE institution_id = $1 AND NOT (id = ANY($2));
      `, [instId, studentIds]);
    } else {
      await runQuery(`
        DELETE FROM students 
        WHERE institution_id = $1;
      `, [instId]);
    }
  },

  // Applications (طلبات الالتحاق)
  getApplications: async (tenant: string): Promise<Application[]> => {
    const res = await runQuery(`
      SELECT 
        a.id, 
        a.full_name as "fullName", 
        a.national_id as "nationalId", 
        a.phone, 
        a.course_id as "courseId", 
        a.photo_url as "photoUrl", 
        a.status, 
        a.created_at as "createdAt"
      FROM applications a
      JOIN institutions i ON a.institution_id = i.id
      WHERE i.subdomain = $1
      ORDER BY a.created_at DESC;
    `, [tenant]);
    return res.rows;
  },
  
  saveApplications: async (tenant: string, apps: Application[]): Promise<void> => {
    // 1. Get institution id
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) return;
    const instId = instRes.rows[0].id;

    // 2. Upsert apps in parallel
    const appIds = apps.map(a => a.id);
    await Promise.all(apps.map(a =>
      runQuery(`
        INSERT INTO applications (id, institution_id, full_name, national_id, phone, course_id, photo_url, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          full_name = EXCLUDED.full_name,
          national_id = EXCLUDED.national_id,
          phone = EXCLUDED.phone,
          course_id = EXCLUDED.course_id,
          photo_url = EXCLUDED.photo_url;
      `, [a.id, instId, a.fullName, a.nationalId, a.phone, a.courseId, a.photoUrl, a.status, a.createdAt])
    ));

    // 3. Delete apps not in list for this institution
    if (appIds.length > 0) {
      await runQuery(`
        DELETE FROM applications 
        WHERE institution_id = $1 AND NOT (id = ANY($2));
      `, [instId, appIds]);
    } else {
      await runQuery(`
        DELETE FROM applications 
        WHERE institution_id = $1;
      `, [instId]);
    }
  },
  
  addApplication: async (tenant: string, app: Omit<Application, "id" | "status" | "createdAt">): Promise<Application> => {
    // 1. Get institution id
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) throw new Error("Institution not found");
    const instId = instRes.rows[0].id;

    const res = await runQuery(`
      INSERT INTO applications (institution_id, full_name, national_id, phone, course_id, photo_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING 
        id, 
        full_name as "fullName", 
        national_id as "nationalId", 
        phone, 
        course_id as "courseId", 
        photo_url as "photoUrl", 
        status, 
        created_at as "createdAt";
    `, [instId, app.fullName, app.nationalId, app.phone, app.courseId, app.photoUrl]);
    
    return res.rows[0];
  },

  // Self Evaluations
  getEvaluations: async (tenant: string, username: string): Promise<SelfEvaluation[]> => {
    const res = await runQuery(`
      SELECT 
        e.id, 
        e.username, 
        e.lecture_number as "lectureNumber", 
        e.understanding_rating as "understandingRating", 
        e.effort_rating as "effortRating", 
        e.notes, 
        e.created_at as "createdAt"
      FROM self_evaluations e
      JOIN institutions i ON e.institution_id = i.id
      WHERE i.subdomain = $1 AND e.username = $2
      ORDER BY e.created_at DESC;
    `, [tenant, username]);
    return res.rows;
  },

  getAllEvaluationsForLecture: async (tenant: string, lectureNumber: number): Promise<Record<string, SelfEvaluation>> => {
    const res = await runQuery(`
      SELECT 
        e.id, 
        e.username, 
        e.lecture_number as "lectureNumber", 
        e.understanding_rating as "understandingRating", 
        e.effort_rating as "effortRating", 
        e.notes, 
        e.created_at as "createdAt"
      FROM self_evaluations e
      JOIN institutions i ON e.institution_id = i.id
      WHERE i.subdomain = $1 AND e.lecture_number = $2
      ORDER BY e.created_at DESC;
    `, [tenant, lectureNumber]);
    
    // Convert to map for easy lookup by username
    const map: Record<string, SelfEvaluation> = {};
    for (const r of res.rows) {
      if (!map[r.username]) {
        map[r.username] = r; // keep the latest one
      }
    }
    return map;
  },
  
  saveEvaluation: async (tenant: string, username: string, evaluation: Omit<SelfEvaluation, "id" | "createdAt">): Promise<SelfEvaluation> => {
    // 1. Get institution id
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) throw new Error("Institution not found");
    const instId = instRes.rows[0].id;

    const res = await runQuery(`
      INSERT INTO self_evaluations (institution_id, username, lecture_number, understanding_rating, effort_rating, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id, 
        username, 
        lecture_number as "lectureNumber", 
        understanding_rating as "understandingRating", 
        effort_rating as "effortRating", 
        notes, 
        created_at as "createdAt";
    `, [instId, username, evaluation.lectureNumber, evaluation.understandingRating, evaluation.effortRating, evaluation.notes]);
    
    return res.rows[0];
  },

  // Quiz Scores
  saveQuizScore: async (tenant: string, username: string, courseId: string, lectureNumber: number, score: number): Promise<void> => {
    // 1. Get institution id
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) return;
    const instId = instRes.rows[0].id;

    // Delete existing score for this lecture (if any) to prevent duplication
    await runQuery(`
      DELETE FROM quiz_scores 
      WHERE institution_id = $1 AND username = $2 AND course_id = $3 AND lecture_number = $4;
    `, [instId, username, courseId, lectureNumber]);

    // Insert new score
    await runQuery(`
      INSERT INTO quiz_scores (institution_id, username, course_id, lecture_number, score)
      VALUES ($1, $2, $3, $4, $5);
    `, [instId, username, courseId, lectureNumber, score]);
  },
  
  getQuizScores: async (tenant: string, username: string): Promise<Record<string, number>> => {
    const res = await runQuery(`
      SELECT 
        q.course_id as "courseId", 
        q.lecture_number as "lectureNumber", 
        q.score
      FROM quiz_scores q
      JOIN institutions i ON q.institution_id = i.id
      WHERE i.subdomain = $1 AND q.username = $2;
    `, [tenant, username]);

    const scores: Record<string, number> = {};
    for (const r of res.rows) {
      scores[`${r.courseId}_${r.lectureNumber}`] = r.score;
    }
    return scores;
  },

  getAllQuizScoresForLecture: async (tenant: string, courseId: string, lectureNumber: number): Promise<Record<string, number>> => {
    const res = await runQuery(`
      SELECT 
        q.username,
        q.score
      FROM quiz_scores q
      JOIN institutions i ON q.institution_id = i.id
      WHERE i.subdomain = $1 AND q.course_id = $2 AND q.lecture_number = $3;
    `, [tenant, courseId, lectureNumber]);

    const scores: Record<string, number> = {};
    for (const r of res.rows) {
      scores[r.username] = r.score;
    }
    return scores;
  },

  getStudentTotalScore: async (tenant: string, username: string): Promise<number> => {
    const scores = await db.getQuizScores(tenant, username);
    return Object.values(scores).reduce((a, b) => a + b, 0) * 10;
  },

  getTenantLeaderboard: async (tenant: string): Promise<Record<string, number>> => {
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) return {};
    const instId = instRes.rows[0].id;
    
    const res = await runQuery(`
      SELECT username, SUM(score) as "totalScore"
      FROM quiz_scores
      WHERE institution_id = $1
      GROUP BY username;
    `, [instId]);
    
    const scores: Record<string, number> = {};
    for (const r of res.rows) {
      scores[r.username] = parseInt(r.totalScore, 10) * 10;
    }
    return scores;
  },

  // Student Tasks
  getStudentTasks: async (courseId: string, lectureNumber?: number): Promise<StudentTask[]> => {
    let query = `
      SELECT id, course_id as "courseId", lecture_number as "lectureNumber", student_phone as "studentPhone", file_url as "fileUrl", created_at as "createdAt"
      FROM student_tasks
      WHERE course_id = $1
    `;
    const params: any[] = [courseId];
    if (lectureNumber) {
      query += ` AND lecture_number = $2`;
      params.push(lectureNumber);
    }
    query += ` ORDER BY created_at DESC;`;
    
    const res = await runQuery(query, params);
    return res.rows;
  },

  saveStudentTask: async (courseId: string, lectureNumber: number, studentPhone: string, fileUrl: string): Promise<void> => {
    await runQuery(`
      INSERT INTO student_tasks (course_id, lecture_number, student_phone, file_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (course_id, lecture_number, student_phone) 
      DO UPDATE SET file_url = EXCLUDED.file_url, created_at = timezone('utc'::text, now());
    `, [courseId, lectureNumber, studentPhone, fileUrl]);
  },

  // Student Progress Aggregation
  getTenantProgress: async (tenant: string): Promise<Record<string, { attendance: number, quiz: number, task: number }>> => {
    const attRes = await runQuery(`
      SELECT a.student_name, count(DISTINCT a.lecture_number) as c 
      FROM attendances a
      JOIN institutions i ON a.institution_id = i.id
      WHERE i.subdomain = $1
      GROUP BY a.student_name
    `, [tenant]);

    const quizRes = await runQuery(`
      SELECT q.username, count(DISTINCT q.lecture_number) as c 
      FROM quiz_scores q
      JOIN institutions i ON q.institution_id = i.id
      WHERE i.subdomain = $1
      GROUP BY q.username
    `, [tenant]);

    const taskRes = await runQuery(`
      SELECT t.student_phone, count(DISTINCT t.lecture_number) as c 
      FROM student_tasks t
      JOIN courses c ON t.course_id = c.id
      JOIN institutions i ON c.institution_id = i.id
      WHERE i.subdomain = $1
      GROUP BY t.student_phone
    `, [tenant]);

    const progress: Record<string, { attendance: number, quiz: number, task: number }> = {};
    
    for (const row of attRes.rows) {
      if (!progress[row.student_name]) progress[row.student_name] = { attendance: 0, quiz: 0, task: 0 };
      progress[row.student_name].attendance = parseInt(row.c, 10);
    }
    for (const row of quizRes.rows) {
      if (!progress[row.username]) progress[row.username] = { attendance: 0, quiz: 0, task: 0 };
      progress[row.username].quiz = parseInt(row.c, 10);
    }
    for (const row of taskRes.rows) {
      if (!progress[row.student_phone]) progress[row.student_phone] = { attendance: 0, quiz: 0, task: 0 };
      progress[row.student_phone].task = parseInt(row.c, 10);
    }

    return progress;
  },

  // Optimized operations for single students & applications
  getStudentByPhone: async (tenant: string, phone: string): Promise<Student | null> => {
    const res = await runQuery(`
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.course_id as "courseId", 
        s.avatar_url as "avatarUrl", 
        s.national_id as "nationalId", 
        s.phone, 
        s.roll_number as "rollNumber", 
        s.whatsapp_group_url as "whatsappGroupUrl", 
        s.lecture_url as "lectureUrl"
      FROM students s
      JOIN institutions i ON s.institution_id = i.id
      WHERE i.subdomain = $1 AND s.phone = $2
      LIMIT 1;
    `, [tenant, phone]);
    return res.rows[0] || null;
  },

  getStudentsByPhone: async (tenant: string, phone: string): Promise<Student[]> => {
    const res = await runQuery(`
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.course_id as "courseId", 
        s.avatar_url as "avatarUrl", 
        s.national_id as "nationalId", 
        s.phone, 
        s.roll_number as "rollNumber", 
        s.whatsapp_group_url as "whatsappGroupUrl", 
        s.lecture_url as "lectureUrl"
      FROM students s
      JOIN institutions i ON s.institution_id = i.id
      WHERE i.subdomain = $1 AND s.phone = $2
      ORDER BY s.created_at ASC;
    `, [tenant, phone]);
    return res.rows;
  },

  getApplicationsByPhone: async (tenant: string, phone: string): Promise<Application[]> => {
    const res = await runQuery(`
      SELECT 
        a.id, 
        a.full_name as "fullName", 
        a.national_id as "nationalId", 
        a.phone, 
        a.course_id as "courseId", 
        a.photo_url as "photoUrl", 
        a.status, 
        a.created_at as "createdAt"
      FROM applications a
      JOIN institutions i ON a.institution_id = i.id
      WHERE i.subdomain = $1 AND a.phone = $2
      ORDER BY a.created_at DESC;
    `, [tenant, phone]);
    return res.rows;
  },

  addStudent: async (tenant: string, student: Omit<Student, "id">): Promise<Student> => {
    const instRes = await runQuery(`SELECT id FROM institutions WHERE subdomain = $1 LIMIT 1;`, [tenant]);
    if (instRes.rows.length === 0) throw new Error("Institution not found");
    const instId = instRes.rows[0].id;
    
    const res = await runQuery(`
      INSERT INTO students (institution_id, name, email, course_id, avatar_url, national_id, phone, roll_number, whatsapp_group_url, lecture_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id, 
        name, 
        email, 
        course_id as "courseId", 
        avatar_url as "avatarUrl", 
        national_id as "nationalId", 
        phone, 
        roll_number as "rollNumber", 
        whatsapp_group_url as "whatsappGroupUrl", 
        lecture_url as "lectureUrl";
    `, [instId, student.name, student.email, student.courseId, student.avatarUrl || null, student.nationalId, student.phone, student.rollNumber, student.whatsappGroupUrl || null, student.lectureUrl || null]);
    
    return res.rows[0];
  },

  updateStudent: async (id: string, updates: Partial<Student>): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;
    
    const mapping: Record<string, string> = {
      name: "name",
      email: "email",
      courseId: "course_id",
      avatarUrl: "avatar_url",
      nationalId: "national_id",
      phone: "phone",
      rollNumber: "roll_number",
      whatsappGroupUrl: "whatsapp_group_url",
      lectureUrl: "lecture_url"
    };

    for (const [key, val] of Object.entries(updates)) {
      const col = mapping[key];
      if (col !== undefined) {
        fields.push(`${col} = $${index}`);
        values.push(val);
        index++;
      }
    }

    if (fields.length === 0) return;
    values.push(id);
    await runQuery(`UPDATE students SET ${fields.join(", ")} WHERE id = $${index};`, values);
  },

  deleteStudent: async (id: string): Promise<void> => {
    await runQuery(`DELETE FROM students WHERE id = $1;`, [id]);
  },

  updateApplicationStatus: async (id: string, status: "pending" | "approved" | "rejected"): Promise<void> => {
    await runQuery(`UPDATE applications SET status = $1 WHERE id = $2;`, [status, id]);
  }
};
