import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // =========================
  // 1. Method check
  // =========================
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // =========================
  // 2. Lấy access token
  // =========================
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  // =========================
  // 3. Verify user (ANON KEY)
  // =========================
  const supabaseAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const {
    data: { user },
    error: authError
  } = await supabaseAuth.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // =========================
  // 4. Check admin role
  // =========================
  const { data: profile, error: profileError } =
    await supabaseAuth
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  if (profile.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // =========================
  // 5. ADMIN ACTION (SERVICE ROLE)
  // =========================
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: authUsers, error: authUsersError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (authUsersError) {
    return res.status(500).json({ error: authUsersError.message });
  }

  // =========================
  // 6. Lấy role từ profiles
  // =========================
  const { data: profiles, error: profilesError } =
    await supabaseAdmin
      .from('profiles')
      .select('id, role');

  if (profilesError) {
    return res.status(500).json({ error: profilesError.message });
  }

  const roleMap = Object.fromEntries(
    profiles.map(p => [p.id, p.role])
  );

  // =========================
  // 7. Gộp data trả về
  // =========================
  const users = authUsers.users.map(u => ({
    id: u.id,
    email: u.email,
    role: roleMap[u.id] || 'user',
    created_at: u.created_at
  }));

  // =========================
  // 8. Response
  // =========================
  return res.status(200).json(users);
}

/*
Thêm vào vercel: Environment Variables
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (server only)
*/