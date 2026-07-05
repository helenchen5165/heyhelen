# 数据库备份与恢复

数据库：Neon Postgres（`neondb`，us-east-1）。词库（words）、博客（posts）、
阅读会话缓存（reader_sessions）等全部数据在此。

## 两层防护

1. **Neon 自带 PITR**：控制台 → Branches → Restore，可回滚到恢复窗口内任意时间点。
   免费档窗口很短（约 24 小时），只够救"刚刚误删"。
2. **每日异地逻辑备份**（`.github/workflows/db-backup.yml`）：每天 03:17 UTC
   `pg_dump` 全库 → gzip → AES-256-CBC 加密 → GitHub Actions Artifact，保留 90 天。
   也可在 Actions 页面手动 Run workflow 立即备份（比如大改动前）。

依赖的 GitHub Secrets（repo → Settings → Secrets and variables → Actions）：

| Secret | 内容 |
|---|---|
| `DATABASE_URL` | 与 Vercel Production 相同的 Neon 连接串（含 `-pooler` 没关系，工作流会自动切直连） |
| `BACKUP_PASSPHRASE` | 备份加密口令。**丢了口令 = 备份全部作废**，务必存密码管理器 |

⚠️ 轮换 Neon 密码后要同步更新这里的 `DATABASE_URL` secret。

## 恢复步骤

1. GitHub → Actions → DB Backup → 选一次成功运行 → 下载 artifact，得到
   `heyhelen-YYYYMMDD-HHMM.sql.gz.enc`
2. 解密解压：
   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
     -in heyhelen-*.sql.gz.enc -pass pass:'<BACKUP_PASSPHRASE>' | gunzip > dump.sql
   ```
3. 恢复目标建议先用 Neon 新建一个 branch/数据库验证，再切换：
   ```bash
   psql "<目标直连URL>" < dump.sql
   ```
4. 验证行数（words、posts 等），确认无误后把应用的 `DATABASE_URL` 指过去。

## 已知边界

- 备份是每日快照，最坏丢一天内的增量；配合 Neon PITR 基本覆盖。
- Artifact 保留 90 天滚动窗口；如需永久归档，手动下载某天的备份妥善保存即可。
