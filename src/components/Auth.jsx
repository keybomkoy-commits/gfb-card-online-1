import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';

export const Auth = () => {
  const { login, register } = useGame();
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
        setError('Please fill in all required fields.');
        setIsLoading(false);
        return;
      }

      if (username.length < 3) {
        setError('Username must be at least 3 characters.');
        setIsLoading(false);
        return;
      }

      if (password.length < 4) {
        setError('Password must be at least 4 characters.');
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
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        const res = await register(username, password);
        if (res.success) {
          setSuccess('Account created successfully!');
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-slate-950 select-none">
      
      {/* Sleek FUT WebApp Card Box */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col">
        
        {/* Branding Emblem */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-widest font-heading leading-none">
            GFB
          </h1>
          <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-2">
            {isLoginView ? 'CLUB MANAGER SUITE' : 'REGISTER NEW MANAGER'}
          </p>
        </div>

        {/* Error/Success Alert Box */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2.5 text-rose-450 text-xs font-semibold leading-relaxed">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-emerald-450 text-xs font-semibold leading-relaxed">
            <span>{success}</span>
          </div>
        )}

        {/* Login Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* USERNAME */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider">
                USERNAME
              </label>
            </div>
            
            <input
              type="text"
              required
              disabled={isLoading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: '100%',
                backgroundColor: '#020617', // bg-slate-955
                border: '1px solid #1e293b', // border-slate-800
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                boxShadow: 'none'
              }}
              className="focus:border-emerald-500 transition-all font-semibold"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider">
                PASSWORD
              </label>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '12px 40px 12px 16px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxShadow: 'none'
                }}
                className="focus:border-emerald-500 transition-all font-semibold"
              />
              
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD (REGISTER ONLY) */}
          {!isLoginView && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider">
                  CONFIRM PASSWORD
                </label>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                style={{
                  width: '100%',
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxShadow: 'none'
                }}
                className="focus:border-emerald-500 transition-all font-semibold"
              />
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: '#10b981', // emerald-500
              color: '#020617', // slate-950
              fontWeight: '800',
              fontSize: '11px',
              letterSpacing: '0.15em',
              padding: '14px',
              borderRadius: '12px',
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer'
            }}
            className="hover:bg-emerald-400 active:scale-[0.98] mt-4 font-black flex items-center justify-center gap-1.5 uppercase shadow-md shadow-emerald-500/10"
          >
            {isLoading ? 'SYNCING CLUB...' : isLoginView ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* View Toggle Footer Links */}
        <div className="mt-8 text-center border-t border-slate-800/80 pt-6">
          <p className="text-slate-400 text-xs font-semibold">
            {isLoginView ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={toggleView}
              className="text-emerald-400 font-extrabold ml-2 hover:underline focus:outline-none"
            >
              {isLoginView ? 'Register here' : 'Sign in here'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
