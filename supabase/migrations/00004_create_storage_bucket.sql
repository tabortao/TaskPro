-- 创建图片存储桶
-- 名称: app-8y2p9eqmj5dt_taskpro_images
-- 公开访问，文件大小限制: 1MB

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-8y2p9eqmj5dt_taskpro_images',
  'app-8y2p9eqmj5dt_taskpro_images',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "认证用户可以上传图片" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-8y2p9eqmj5dt_taskpro_images');

CREATE POLICY "所有人可以查看图片" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'app-8y2p9eqmj5dt_taskpro_images');