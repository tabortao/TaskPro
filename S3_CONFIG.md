# S3 存储配置说明

TaskPro 使用 Supabase Storage 作为统一的文件存储服务。系统管理员需要在后台配置 S3 存储参数。

## 配置步骤

### 1. 登录 Supabase 控制台

访问 [Supabase Dashboard](https://app.supabase.com/) 并登录您的账号。

### 2. 选择项目

在项目列表中选择 TaskPro 对应的项目。

### 3. 配置存储桶

1. 在左侧菜单中点击 **Storage**
2. 确认已创建存储桶：`app-8y2p9eqmj5dt_images`
3. 点击存储桶名称进入设置
4. 配置存储桶策略：
   - 允许认证用户上传文件
   - 允许公开读取文件

### 4. 获取 API 凭证

1. 在左侧菜单中点击 **Settings** > **API**
2. 复制以下信息：
   - **Project URL**: 项目的 API 端点
   - **anon public**: 匿名公钥（用于客户端）
   - **service_role secret**: 服务角色密钥（仅用于服务端）

### 5. 配置环境变量

在项目根目录的 `.env` 文件中配置以下变量：

```bash
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 存储桶名称
VITE_STORAGE_BUCKET=app-8y2p9eqmj5dt_images
```

### 6. 存储策略配置

在 Supabase 控制台的 Storage > Policies 中配置以下策略：

#### 上传策略（INSERT）
```sql
-- 允许认证用户上传文件
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-8y2p9eqmj5dt_images');
```

#### 读取策略（SELECT）
```sql
-- 允许所有用户读取文件
CREATE POLICY "Allow public to read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-8y2p9eqmj5dt_images');
```

#### 删除策略（DELETE）
```sql
-- 允许用户删除自己上传的文件
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-8y2p9eqmj5dt_images' AND auth.uid()::text = owner);
```

### 7. 文件大小限制

默认文件大小限制为 1MB。如需调整：

1. 在 Storage 设置中找到 **File size limit**
2. 修改为所需大小（建议不超过 5MB）
3. 保存设置

### 8. 验证配置

1. 重启应用
2. 尝试上传图片
3. 检查 Supabase Storage 中是否成功存储文件

## 注意事项

- **安全性**：不要将 `service_role` 密钥暴露在客户端代码中
- **备份**：定期备份存储桶中的重要文件
- **监控**：定期检查存储使用量，避免超出配额
- **清理**：定期清理未使用的文件以节省空间

## 故障排查

### 上传失败

1. 检查环境变量是否正确配置
2. 确认存储桶策略是否正确设置
3. 检查用户是否已认证
4. 查看浏览器控制台的错误信息

### 文件无法访问

1. 确认读取策略已正确配置
2. 检查文件 URL 是否正确
3. 确认存储桶为公开访问

### 存储空间不足

1. 登录 Supabase 控制台查看使用量
2. 升级套餐或清理旧文件
3. 优化图片压缩策略
