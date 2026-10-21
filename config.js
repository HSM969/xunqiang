// ── 循腔 · 联网配置（只改这个文件）───────────────────────────
// mode: 'local'    → 不收集数据，问卷和成绩只存在玩家自己手机上（纯静态也能玩）
// mode: 'supabase' → 数据写进 Supabase 免费数据库，可在后台看到并导出 CSV
window.XQ_CONFIG = {
  mode: 'local',

  // 下面两项在 Supabase 后台 Settings → API 里复制（Project URL 和 anon public key）
  supabaseUrl: '',   // 例：https://abcdefghijklmno.supabase.co
  supabaseKey: ''    // 例：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx.yyyyy
};
