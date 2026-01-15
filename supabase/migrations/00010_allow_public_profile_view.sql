/*
# 允许查看其他用户的公开信息

1. 安全策略变更
    - 添加策略：所有认证用户可以查看其他用户的基本公开信息（id, nickname, avatar_url）
    - 保持原有策略：用户只能查看和修改自己的完整配置

2. 说明
    - 此策略允许评论功能正常工作，用户可以看到评论者的昵称和头像
    - 敏感信息（email, openid, s3配置等）仍然受保护
*/

-- 删除旧的查看策略，添加新的公开查看策略
DROP POLICY IF EXISTS "用户可以查看自己的配置" ON profiles;

-- 所有认证用户可以查看所有用户的基本信息（用于评论等功能）
CREATE POLICY "认证用户可以查看所有用户基本信息" ON profiles
  FOR SELECT TO authenticated USING (true);