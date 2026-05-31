-- ==========================================
-- 🚀 المخطط الهيكلي لقاعدة بيانات (SaaS)
-- قم بنسخ هذا الكود ولصقه في Supabase SQL Editor
-- ==========================================

-- 1. جدول المؤسسات/المراكز (Tenants)
CREATE TABLE institutions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. جدول المستخدمين (Users Extension)
-- نعتمد على auth.users في Supabase ولكننا نربطهم بالمركز هنا
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'student')) DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. جدول الدورات (Courses)
CREATE TABLE courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    lectures_count INT DEFAULT 1,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. جدول الحجوزات (Enrollments)
CREATE TABLE enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'paid')) DEFAULT 'pending',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, course_id) -- يمنع تسجيل الطالب في نفس الدورة مرتين
);

-- 5. جدول البطاقات التعليمية (Flashcards)
CREATE TABLE flashcards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 🔐 إعدادات الحماية والتأمين (Row Level Security)
-- ==========================================

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- السماح للزوار برؤية المراكز والدورات
CREATE POLICY "Allow public read access to institutions" ON institutions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to courses" ON courses FOR SELECT USING (true);

-- سياسات الطلاب (يمكن للطالب رؤية بياناته ودوراته فقط)
CREATE POLICY "Students can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Students can read own enrollments" ON enrollments FOR SELECT USING (auth.uid() = student_id);

-- سياسات الأدمن (يمكن لأدمن المركز رؤية وتعديل بيانات مركزه فقط)
-- تتطلب كتابة دوال مخصصة لـ RLS بناءً على الـ institution_id
