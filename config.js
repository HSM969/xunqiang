// ── 循腔 · 联网配置（只改这个文件）───────────────────────────
// mode: 'local'    → 不收集数据，问卷和成绩只存在玩家自己手机上
// mode: 'supabase' → 数据写进 Supabase 免费数据库，可在后台看到并导出 CSV
window.XQ_CONFIG = {
  mode: 'supabase',

  // Supabase → Settings → API
  supabaseUrl: 'https://fcpzmyoqxqjxlazpovsq.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcHpteW9xeHFqeGxhenBvdnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTEzNjMsImV4cCI6MjEwODE2NzM2M30.TzKr4p648EUOMtzaKjKOxxro9gk3sIiTidsTn7sgDhc'
};
