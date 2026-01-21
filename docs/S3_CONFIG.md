# S3 存储配置说明

TaskPro 使用 S3 兼容的对象存储服务来存储用户上传的图片和附件。支持 Cloudflare R2、AWS S3、MinIO 等 S3 兼容存储。

## 支持的存储服务

- **Cloudflare R2**（推荐）：免费额度大，速度快，无出站流量费用
- **AWS S3**：功能最完整，全球覆盖
- **MinIO**：自托管方案，完全控制
- **阿里云 OSS**：国内访问速度快
- **腾讯云 COS**：国内访问速度快

## Cloudflare R2 配置步骤

### 1. 创建 R2 存储桶

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在左侧菜单中选择 **R2**
3. 点击 **Create bucket**
4. 输入存储桶名称：`taskpro-images`
5. 选择位置（建议选择 Automatic）
6. 点击 **Create bucket**

### 2. 配置公开访问

1. 进入创建的存储桶
2. 点击 **Settings** 标签
3. 在 **Public access** 部分，点击 **Allow Access**
4. 记录下 **Public bucket URL**（例如：`https://pub-xxxxx.r2.dev`）

### 3. 创建 API 令牌

1. 在 R2 页面，点击右上角的 **Manage R2 API Tokens**
2. 点击 **Create API token**
3. 配置权限：
   - **Token name**: `taskpro-upload`
   - **Permissions**: Object Read & Write
   - **Bucket**: 选择刚创建的 `taskpro-images`
4. 点击 **Create API Token**
5. 记录下以下信息：
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint URL**（例如：`https://xxxxx.r2.cloudflarestorage.com`）

### 4. 配置自定义域名（可选但推荐）

1. 在存储桶的 **Settings** 中找到 **Custom Domains**
2. 点击 **Connect Domain**
3. 输入您的域名（例如：`cdn.yourdomain.com`）
4. 按照提示添加 DNS 记录
5. 等待 DNS 生效后，使用自定义域名访问文件

### 5. 配置 CORS（跨域资源共享）

在 R2 存储桶的 **Settings** 中配置 CORS 规则：

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 6. 配置环境变量

在项目根目录的 `.env` 文件中配置以下变量：

```bash
# S3 兼容存储配置（Cloudflare R2）
TARO_APP_S3_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
TARO_APP_S3_ACCESS_KEY_ID=your-access-key-id
TARO_APP_S3_SECRET_ACCESS_KEY=your-secret-access-key
TARO_APP_S3_BUCKET=taskpro-images
TARO_APP_S3_REGION=auto
TARO_APP_S3_PUBLIC_URL=https://cdn.yourdomain.com
```

**配置说明**：
- `TARO_APP_S3_ENDPOINT`: R2 API 端点
- `TARO_APP_S3_ACCESS_KEY_ID`: API 令牌的 Access Key ID
- `TARO_APP_S3_SECRET_ACCESS_KEY`: API 令牌的 Secret Access Key
- `TARO_APP_S3_BUCKET`: 存储桶名称
- `TARO_APP_S3_REGION`: 区域（R2 使用 `auto`）
- `TARO_APP_S3_PUBLIC_URL`: 公开访问 URL（自定义域名或 R2 公开 URL）

## AWS S3 配置步骤

### 1. 创建 S3 存储桶

1. 登录 [AWS Console](https://console.aws.amazon.com/)
2. 进入 **S3** 服务
3. 点击 **Create bucket**
4. 配置：
   - **Bucket name**: `taskpro-images`
   - **Region**: 选择离用户最近的区域
   - **Block Public Access**: 取消勾选（允许公开访问）
5. 点击 **Create bucket**

### 2. 配置存储桶策略

在存储桶的 **Permissions** 标签中，添加以下策略：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::taskpro-images/*"
    }
  ]
}
```

### 3. 配置 CORS

在存储桶的 **Permissions** > **CORS** 中添加：

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4. 创建 IAM 用户

1. 进入 **IAM** 服务
2. 创建新用户：`taskpro-uploader`
3. 附加策略：`AmazonS3FullAccess`（或自定义策略）
4. 创建访问密钥，记录 **Access Key ID** 和 **Secret Access Key**

### 5. 配置环境变量

```bash
# S3 兼容存储配置（AWS S3）
TARO_APP_S3_ENDPOINT=https://s3.amazonaws.com
TARO_APP_S3_ACCESS_KEY_ID=your-access-key-id
TARO_APP_S3_SECRET_ACCESS_KEY=your-secret-access-key
TARO_APP_S3_BUCKET=taskpro-images
TARO_APP_S3_REGION=us-east-1
TARO_APP_S3_PUBLIC_URL=https://taskpro-images.s3.amazonaws.com
```

## MinIO 自托管配置

### 1. 安装 MinIO

使用 Docker 快速部署：

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=your-password" \
  -v /data/minio:/data \
  minio/minio server /data --console-address ":9001"
```

### 2. 创建存储桶

1. 访问 MinIO Console：`http://localhost:9001`
2. 使用管理员账号登录
3. 创建存储桶：`taskpro-images`
4. 设置访问策略为 **Public**

### 3. 创建访问密钥

1. 在 MinIO Console 中进入 **Access Keys**
2. 创建新的访问密钥
3. 记录 **Access Key** 和 **Secret Key**

### 4. 配置环境变量

```bash
# S3 兼容存储配置（MinIO）
TARO_APP_S3_ENDPOINT=http://localhost:9000
TARO_APP_S3_ACCESS_KEY_ID=your-access-key
TARO_APP_S3_SECRET_ACCESS_KEY=your-secret-key
TARO_APP_S3_BUCKET=taskpro-images
TARO_APP_S3_REGION=us-east-1
TARO_APP_S3_PUBLIC_URL=http://localhost:9000/taskpro-images
```

## 验证配置

### 1. 重启应用

修改 `.env` 文件后，需要重启应用：

```bash
pnpm run dev:weapp  # 微信小程序
# 或
pnpm run dev:h5     # H5
```

### 2. 测试上传

1. 在应用中创建任务
2. 点击图片上传按钮
3. 选择图片并上传
4. 检查是否上传成功

### 3. 验证访问

1. 复制上传成功后的图片 URL
2. 在浏览器中打开 URL
3. 确认图片可以正常访问

## 故障排查

### 上传失败

**问题**：上传时提示"上传失败"

**解决方案**：
1. 检查环境变量是否正确配置
2. 确认 Access Key 和 Secret Key 是否有效
3. 检查存储桶是否存在
4. 查看浏览器控制台的详细错误信息

### 图片无法访问

**问题**：上传成功但图片无法访问

**解决方案**：
1. 确认存储桶已设置为公开访问
2. 检查 CORS 配置是否正确
3. 确认 `TARO_APP_S3_PUBLIC_URL` 配置正确
4. 检查防火墙或安全组设置

### CORS 错误

**问题**：浏览器提示 CORS 错误

**解决方案**：
1. 在存储桶中配置 CORS 规则
2. 确保 `AllowedOrigins` 包含您的域名
3. 重启应用并清除浏览器缓存

### 文件名错误

**问题**：上传时提示"文件名只能包含英文字母和数字"

**解决方案**：
- 这是预期行为，文件名会自动生成
- 如果需要支持中文文件名，需要修改 `src/utils/upload.ts` 中的验证逻辑

## 成本优化建议

### Cloudflare R2
- **免费额度**：10GB 存储，每月 1000 万次 Class A 操作
- **优势**：无出站流量费用
- **建议**：适合中小型应用

### AWS S3
- **成本**：按存储量和请求次数计费
- **优化**：
  - 使用 S3 Intelligent-Tiering 自动优化存储成本
  - 配置生命周期规则自动删除旧文件
  - 使用 CloudFront CDN 减少 S3 请求次数

### MinIO
- **成本**：仅服务器成本
- **优势**：完全控制，无限制
- **建议**：适合有自己服务器的团队

## 安全建议

1. **访问密钥安全**：
   - 不要将密钥提交到代码仓库
   - 定期轮换访问密钥
   - 使用最小权限原则

2. **存储桶安全**：
   - 只允许必要的公开访问
   - 启用版本控制以防误删
   - 配置访问日志监控异常访问

3. **内容安全**：
   - 实施文件类型验证
   - 限制文件大小
   - 扫描上传文件的恶意内容

4. **网络安全**：
   - 使用 HTTPS 传输
   - 配置 CDN 加速和保护
   - 启用防盗链保护
