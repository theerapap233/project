-- =====================================================================
-- ตั้งเวลาส่งอีเมลสรุปผู้สมัครทุนใหม่ วันละ 1 ครั้ง
-- รันใน Supabase Dashboard > SQL Editor ทีละส่วนตามลำดับ
-- ต้อง deploy Edge Function "daily-application-digest" ก่อน
-- =====================================================================

-- ---------------------------------------------------------------------
-- ส่วนที่ 1: เปิดส่วนเสริมที่ต้องใช้ (รันครั้งเดียว)
-- pg_cron = ตัวตั้งเวลา, pg_net = ให้ฐานข้อมูลเรียก URL ได้
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;


-- ---------------------------------------------------------------------
-- ส่วนที่ 2: เก็บ URL ของโปรเจกต์ และรหัสลับ ไว้ใน Vault (รันครั้งเดียว)
-- แก้ 2 ค่าในเครื่องหมาย '...' ก่อนรัน:
--   <PROJECT_REF>  = รหัสโปรเจกต์ Supabase (ดูจาก Project Settings > General)
--   <CRON_SECRET>  = รหัสลับตัวเดียวกับ DIGEST_CRON_SECRET ที่ตั้งใน Edge Function Secrets
-- ---------------------------------------------------------------------
select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'digest_project_url');
select vault.create_secret('<CRON_SECRET>', 'digest_cron_secret');


-- ---------------------------------------------------------------------
-- ส่วนที่ 3: ทดสอบเรียกฟังก์ชันทันที (ไม่ส่งอีเมลจริง)
-- hours = 720 คือย้อนหลัง 30 วัน เพื่อให้มีข้อมูลมาทดสอบ
-- รันแล้วรอ 5-10 วินาที แล้วรันคำสั่งในส่วนที่ 6 เพื่อดูผล
-- ---------------------------------------------------------------------
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'digest_project_url')
         || '/functions/v1/daily-application-digest',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'digest_cron_secret')
  ),
  body := jsonb_build_object('hours', 720, 'dryRun', true),
  timeout_milliseconds := 30000
);


-- ---------------------------------------------------------------------
-- ส่วนที่ 4: ทดสอบส่งอีเมลจริง 1 ฉบับ (ย้อนหลัง 30 วัน)
-- ---------------------------------------------------------------------
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'digest_project_url')
         || '/functions/v1/daily-application-digest',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'digest_cron_secret')
  ),
  body := jsonb_build_object('hours', 720),
  timeout_milliseconds := 30000
);


-- ---------------------------------------------------------------------
-- ส่วนที่ 5: ตั้งเวลาให้ส่งทุกวัน
-- '0 11 * * *' = ทุกวันเวลา 11:00 UTC = 18:00 น. เวลาไทย
-- อีเมลจะสรุปผู้สมัครในช่วง 24 ชั่วโมงก่อนหน้า (18:00 เมื่อวาน ถึง 18:00 วันนี้)
-- อยากเปลี่ยนเวลา: เอาเวลาไทยลบ 7 ชั่วโมง เช่น 08:00 น. ไทย = '0 1 * * *'
-- ---------------------------------------------------------------------
select cron.schedule(
  'daily-application-digest',
  '0 11 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'digest_project_url')
           || '/functions/v1/daily-application-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'digest_cron_secret')
    ),
    body := jsonb_build_object('hours', 24),
    timeout_milliseconds := 30000
  );
  $$
);


-- ---------------------------------------------------------------------
-- ส่วนที่ 6: คำสั่งตรวจสอบ (รันเมื่อไหร่ก็ได้)
-- ---------------------------------------------------------------------
-- ผลการเรียกฟังก์ชันล่าสุด (ดูช่อง status_code และ content)
select id, status_code, content, error_msg, created
from net._http_response
order by created desc
limit 5;

-- งานที่ตั้งเวลาไว้
select jobid, jobname, schedule, active from cron.job;

-- ประวัติการทำงานของตัวตั้งเวลา
select jobid, status, return_message, start_time
from cron.job_run_details
order by start_time desc
limit 10;


-- ---------------------------------------------------------------------
-- ส่วนที่ 7: ถ้าต้องการหยุดส่ง หรือเปลี่ยนเวลา
-- ---------------------------------------------------------------------
-- หยุดส่ง:
-- select cron.unschedule('daily-application-digest');
-- เปลี่ยนเวลา: รัน cron.schedule ในส่วนที่ 5 ซ้ำด้วยชื่อเดิมและเวลาใหม่ ระบบจะแทนที่ของเดิมให้
