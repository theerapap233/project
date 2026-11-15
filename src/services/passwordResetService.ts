import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type PasswordResetScope = 'student' | 'staff';

interface PasswordResetResponse {
  success?: boolean;
  message?: string;
}

const invokePasswordReset = async (
  body: Record<string, string>
): Promise<{ success: boolean; message?: string }> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'ระบบรีเซ็ตรหัสผ่านยังไม่ได้เชื่อมต่อกับ Supabase'
    };
  }

  const { data, error } = await supabase.functions.invoke<PasswordResetResponse>(
    'password-reset',
    { body }
  );

  if (error) {
    console.error('Password reset request failed:', error.message);
    return {
      success: false,
      message: 'ไม่สามารถเชื่อมต่อระบบรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่ภายหลัง'
    };
  }

  if (!data?.success) {
    return {
      success: false,
      message: data?.message || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่ภายหลัง'
    };
  }

  return { success: true, message: data.message };
};

export const passwordResetService = {
  requestOtp(scope: PasswordResetScope, email: string) {
    return invokePasswordReset({
      action: 'request',
      scope,
      email: email.trim().toLowerCase()
    });
  },

  resetPassword(scope: PasswordResetScope, email: string, otp: string, password: string) {
    return invokePasswordReset({
      action: 'reset',
      scope,
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      password
    });
  }
};
