/*
# 从 profiles 表删除 S3 配置字段

1. 删除字段
    - `s3_endpoint`
    - `s3_access_key`
    - `s3_secret_key`
    - `s3_bucket`
    - `s3_region`

2. 说明
    - S3 配置改为系统统一管理
    - 使用环境变量配置存储服务
*/

ALTER TABLE profiles DROP COLUMN IF EXISTS s3_endpoint;
ALTER TABLE profiles DROP COLUMN IF EXISTS s3_access_key;
ALTER TABLE profiles DROP COLUMN IF EXISTS s3_secret_key;
ALTER TABLE profiles DROP COLUMN IF EXISTS s3_bucket;
ALTER TABLE profiles DROP COLUMN IF EXISTS s3_region;