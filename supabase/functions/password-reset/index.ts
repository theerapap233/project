import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const genericRequestMessage =
  'หากอีเมลนี้ผูกกับบัญชีที่ใช้งานได้ ระบบจะส่งรหัส OTP ไปให้ภายในไม่กี่นาที';

type Scope = 'student' | 'staff';

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

const isValidEmail = (email: string) =>
  email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isScope = (value: unknown): value is Scope => value === 'student' || value === 'staff';

const hashOtp = async (scope: Scope, email: string, otp: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${scope}:${email}:${otp}`)
  );
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
};

const createOtp = () => {
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return (bytes[0] % 1_000_000).toString().padStart(6, '0');
};

const createStudentPasswordHash = async (password: string, salt: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${password}`)
  );
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

const createSalt = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse(405, { success: false, message: 'Method not allowed' });
  }

  let payloadValue: unknown;
  try {
    payloadValue = await request.json();
  } catch {
    return jsonResponse(400, { success: false, message: 'Invalid request' });
  }

  if (!payloadValue || typeof payloadValue !== 'object' || Array.isArray(payloadValue)) {
    return jsonResponse(400, { success: false, message: 'Invalid request' });
  }

  const payload = payloadValue as Record<string, unknown>;
  const action = payload.action;
  const scope = payload.scope;
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';

  if ((action !== 'request' && action !== 'reset') || !isScope(scope) || !isValidEmail(email)) {
    return jsonResponse(400, { success: false, message: 'กรุณาตรวจสอบข้อมูลที่กรอก' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const otpHashSecret = Deno.env.get('OTP_HASH_SECRET');

  if (!supabaseUrl || !serviceRoleKey || !otpHashSecret || otpHashSecret.length < 32) {
    console.error('Password reset function secrets are not configured');
    return jsonResponse(500, {
      success: false,
      message: 'ระบบรีเซ็ตรหัสผ่านยังไม่พร้อมใช้งาน'
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    if (action === 'request') {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const emailFrom = Deno.env.get('EMAIL_FROM');
      if (!resendApiKey || !emailFrom) {
        console.error('Resend secrets are not configured');
        return jsonResponse(500, {
          success: false,
          message: 'ระบบส่งอีเมลยังไม่พร้อมใช้งาน'
        });
      }

      const otp = createOtp();
      const codeHash = await hashOtp(scope, email, otp, otpHashSecret);
      const { data: issued, error: issueError } = await supabase.rpc(
        'request_password_reset_otp',
        { p_scope: scope, p_email: email, p_code_hash: codeHash }
      );

      if (issueError) {
        console.error('Password reset OTP issue failed:', issueError.message);
        return jsonResponse(500, {
          success: false,
          message: 'ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่ภายหลัง'
        });
      }

      if (!issued) {
        return jsonResponse(200, { success: true, message: genericRequestMessage });
      }

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [email],
          subject: 'รหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
          text: `รหัส OTP ของคุณคือ ${otp}\nรหัสนี้มีอายุ 10 นาทีและใช้ได้เพียงครั้งเดียว หากคุณไม่ได้ร้องขอ สามารถละเว้นอีเมลนี้ได้`,
          html: `<p>รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p><p>รหัสนี้มีอายุ 10 นาทีและใช้ได้เพียงครั้งเดียว หากคุณไม่ได้ร้องขอ สามารถละเว้นอีเมลนี้ได้</p>`
        })
      });

      if (!emailResponse.ok) {
        console.error('Resend rejected password reset email:', emailResponse.status);
        const { error: deleteError } = await supabase
          .from('password_reset_otps')
          .delete()
          .eq('scope', scope)
          .eq('email', email);
        if (deleteError) {
          console.error('Failed to remove undelivered password reset OTP:', deleteError.message);
        }
        return jsonResponse(502, {
          success: false,
          message: 'ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่ภายหลัง'
        });
      }

      return jsonResponse(200, { success: true, message: genericRequestMessage });
    }

    const otp = typeof payload.otp === 'string' ? payload.otp.trim() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!/^\d{6}$/.test(otp) || password.length < 8 || password.length > 128) {
      return jsonResponse(400, {
        success: false,
        message: 'รหัส OTP ต้องมี 6 หลัก และรหัสผ่านใหม่ต้องมีความยาว 8-128 ตัวอักษร'
      });
    }

    const codeHash = await hashOtp(scope, email, otp, otpHashSecret);
    const studentSalt = scope === 'student' ? createSalt() : '';
    const studentPasswordHash =
      scope === 'student' ? await createStudentPasswordHash(password, studentSalt) : '';
    const { data: result, error: resetError } = await supabase.rpc(
      'complete_password_reset_with_otp',
      {
        p_scope: scope,
        p_email: email,
        p_code_hash: codeHash,
        p_new_password: password,
        p_student_password_hash: studentPasswordHash,
        p_student_password_salt: studentSalt
      }
    );

    if (resetError) {
      console.error('Password reset completion failed:', resetError.message);
      return jsonResponse(500, {
        success: false,
        message: 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่ภายหลัง'
      });
    }

    if (result === 'locked') {
      return jsonResponse(429, {
        success: false,
        message: 'กรอกรหัส OTP เกินจำนวนครั้งที่กำหนด กรุณาขอรหัสใหม่'
      });
    }

    if (result !== 'success') {
      return jsonResponse(400, {
        success: false,
        message: 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ กรุณาตรวจสอบหรือขอรหัสใหม่'
      });
    }

    return jsonResponse(200, { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error(
      'Password reset request failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return jsonResponse(500, {
      success: false,
      message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน กรุณาลองใหม่ภายหลัง'
    });
  }
});
