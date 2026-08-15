import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    const connectionString = "postgres://postgres.vidahzporaivvfurnesx:ilVhbRS2vOEE1NTa@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
  }
  return pool;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getPool();

    // Handle bulk queries
    if (body.queries && Array.isArray(body.queries)) {
      const results = [];
      for (const q of body.queries) {
        if (!q.query) continue;
        const res = await client.query(q.query, q.values || []);
        results.push({ rows: res.rows, rowCount: res.rowCount });
      }
      return NextResponse.json({ results });
    }

    // Handle single query (legacy support)
    const { query, values } = body;
    if (!query) {
      return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
    }

    const result = await client.query(query, values || []);
    
    return NextResponse.json({ rows: result.rows, rowCount: result.rowCount });
  } catch (error: any) {
    console.error("API DB Router Error:", error);
    return NextResponse.json({ error: error.message || "Database execution failed" }, { status: 500 });
  }
}
