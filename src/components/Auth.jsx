import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { isConfigured } from '../firebase';

export const Auth = () => {
  const { login, register, firebaseActive } = useGame();
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!username.trim() || !password.trim()) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        setIsLoading(false);
        return;
      }

      if (username.length < 3) {
        setError('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
        setIsLoading(false);
        return;
      }

      if (password.length < 4) {
        setError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
        setIsLoading(false);
        return;
      }

      if (isLoginView) {
        const res = await login(username, password);
        if (!res.success) {
          setError(res.message);
        }
      } else {
        if (password !== confirmPassword) {
          setError('รหัสผ่านไม่ตรงกัน');
          setIsLoading(false);
          return;
        }
        const res = await register(username, password);
        if (res.success) {
          setSuccess('สมัครสมาชิกสำเร็จ! เริ่มสร้างดรีมทีมของคุณเลย');
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      console.error(err);
      setError('การดำเนินการขัดข้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Background Graphic elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-82 h-82 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-premium p-8 border border-white/5 relative z-10">
        
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-xl items-center justify-center mb-4">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <span className="text-emerald-400 font-black text-2xl tracking-tighter">GFB</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-white tracking-wide">
            GFB CARD ONLINE
          </h2>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-1">
            {isLoginView ? 'ลงชื่อเข้าใช้สู่ลีคฟุตบอล' : 'สร้างไอดีนักเตะของคุณ'}
          </p>

          {/* Connection Status Badge */}
          <div className="mt-3.5 flex flex-col items-center gap-2">
            {firebaseActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                เซิร์ฟเวอร์คลาวด์ออนไลน์ (Firebase)
              </span>
            ) : isConfigured ? (
              <div className="flex flex-col items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-rose-500/10 border border-rose-500/20 text-rose-450">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-450 animate-ping" />
                  สิทธิ์การเขียนอ่านถูกบล็อก (Firebase Rules Error)
                </span>
                <p className="text-[10px] text-rose-350 text-center leading-relaxed max-w-[340px] font-semibold bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-xl">
                  ⚠️ ตรวจพบระบบความปลอดภัยคลาวด์ล็อก: กรุณาเข้าไปที่ Firebase Console &rarr; Firestore Database &rarr; แท็บ Rules &rarr; เปลี่ยนเป็น <code>allow read, write: if true;</code> แล้วกดปุ่ม <b>Publish</b> สีน้ำเงิน เพื่ออนุญาตการลงทะเบียนผู้เล่นออนไลน์
                </p>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 text-amber-300 text-center max-w-[280px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                ออฟไลน์ดาต้าเบส (LocalStorage Fallback)
              </span>
            )}
          </div>
        </div>

        {/* Form Alerts */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-center gap-3 text-rose-400 text-sm font-semibold">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 text-emerald-400 text-sm font-semibold">
            <LogIn size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Auth form input controls */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2">
              ชื่อผู้ใช้ (Username)
            </label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้ของคุณ..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-650 hover:text-slate-450 focus:outline-none disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLoginView && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-2">
                ยืนยันรหัสผ่าน (Confirm Password)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านอีกครั้ง..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold disabled:opacity-50"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-6 shadow-xl disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                <span>กำลังเชื่อมต่อคลาวด์เซิร์ฟเวอร์...</span>
              </span>
            ) : isLoginView ? (
              <>
                <LogIn size={18} />
                <span>เข้าสู่ระบบ</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>สมัครสมาชิก</span>
              </>
            )}
          </button>
        </form>

        {/* View Toggle */}
        <div className="mt-8 text-center border-t border-slate-900 pt-6">
          <p className="text-gray-400 text-sm">
            {isLoginView ? 'ยังไม่มีบัญชีนักเล่นการ์ด?' : 'มีบัญชีอยู่แล้ว?'}
            <button
              onClick={toggleView}
              disabled={isLoading}
              className="text-emerald-400 font-bold ml-1.5 hover:underline focus:outline-none disabled:opacity-50"
            >
              {isLoginView ? 'สมัครสมาชิกที่นี่' : 'เข้าสู่ระบบที่นี่'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
