/*
# 创建用户配置表和认证系统

1. 新建表
   - `profiles`
     - `id` (uuid, 主键, 引用 auth.users)
     - `username` (text, 唯一)
     - `email` (text)
     - `openid` (text) - 微信 openid，不设置唯一约束
     - `nickname` (text)
     - `avatar_url` (text)
     - `role` (user_role, 默认: 'user')
     - `s3_endpoint` (text) - 用户自定义 S3 端点
     - `s3_access_key` (text) - S3 访问密钥
     - `s3_secret_key` (text) - S3 密钥
     - `s3_bucket` (text) - S3 存储桶名称
     - `s3_region` (text) - S3 区域
     - `created_at` (timestamptz, 默认: now())

2. 安全策略
   - 启用 RLS
   - 创建 is_admin 辅助函数
   - 管理员可以访问所有配置
   - 用户可以查看和更新自己的配置（不能修改 role）

3. 认证触发器
   - 当用户确认邮箱后自动同步到 profiles 表
   - 第一个用户自动设置为管理员
   - 同步 username、email、openid 字段
*/

CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  email text,
  openid text,
  nickname text,
  avatar_url text,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  s3_endpoint text,
  s3_access_key text,
  s3_secret_key text,
  s3_bucket text,
  s3_region text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

CREATE POLICY "管理员可以访问所有配置" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的配置" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的配置" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  user_username text;
  user_email text;
  user_openid text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- 提取 username（从 email 中去除 @miaoda.com 或 @wechat.login）
  IF NEW.email LIKE '%@miaoda.com' THEN
    user_username := REPLACE(NEW.email, '@miaoda.com', '');
    user_email := NULL;
    user_openid := NULL;
  ELSIF NEW.email LIKE '%@wechat.login' THEN
    user_username := NULL;
    user_email := NULL;
    user_openid := COALESCE((NEW.raw_user_meta_data->>'openid')::text, NULL);
  ELSE
    user_username := NULL;
    user_email := NEW.email;
    user_openid := NULL;
  END IF;
  
  INSERT INTO public.profiles (id, username, email, openid, role)
  VALUES (
    NEW.id,
    user_username,
    user_email,
    user_openid,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();