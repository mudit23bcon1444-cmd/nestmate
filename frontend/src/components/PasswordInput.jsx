import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

// Lazy-loaded zxcvbn instance cache
let zxcvbnModule = null;

export default function PasswordInput({
  id = 'password',
  name = 'password',
  value = '',
  onChange,
  placeholder = 'Enter password',
  autoComplete = 'current-password',
  showStrengthMeter = false,
  userInputs = [],
  required = true,
  disabled = false,
  className = '',
  minLength = 10,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, feedback: {} });
  const [isZxcvbnLoaded, setIsZxcvbnLoaded] = useState(!!zxcvbnModule);

  useEffect(() => {
    if (!showStrengthMeter) return;

    if (!zxcvbnModule) {
      import('zxcvbn')
        .then((mod) => {
          zxcvbnModule = mod.default || mod;
          setIsZxcvbnLoaded(true);
        })
        .catch(() => {
          // Fallback silently if zxcvbn fails to load
        });
    }
  }, [showStrengthMeter]);

  useEffect(() => {
    if (!showStrengthMeter || !value) {
      setStrength({ score: 0, feedback: {} });
      return;
    }

    if (zxcvbnModule) {
      const res = zxcvbnModule(value, userInputs);
      setStrength({
        score: res.score,
        feedback: res.feedback || {},
      });
    } else {
      // Basic fallback estimation until zxcvbn finishes lazy loading
      let score = 0;
      if (value.length >= 10) score = 1;
      if (value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value)) score = 2;
      if (value.length >= 14 && /[^A-Za-z0-9]/.test(value)) score = 3;
      setStrength({ score, feedback: {} });
    }
  }, [value, showStrengthMeter, isZxcvbnLoaded, userInputs]);

  // Byte length check for bcrypt 72 byte limit
  const byteLength = new TextEncoder().encode(value).length;
  const isTooLong = byteLength > 72;

  const scoreLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const scoreColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-emerald-600',
  ];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          className="w-full bg-surface-container/60 border border-outline rounded-xl px-4 py-2.5 pr-11 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrengthMeter && value.length > 0 && (
        <div className="pt-1 space-y-1.5">
          {/* Strength bar */}
          <div className="flex gap-1 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            {[0, 1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 transition-all duration-300 rounded-full ${
                  strength.score > step ? scoreColors[strength.score] : 'bg-outline-variant/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-on-surface-variant">
              Strength:{' '}
              <span className={`font-semibold ${strength.score >= 3 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {scoreLabels[strength.score]}
              </span>
            </span>
            <span className="text-on-surface-variant">
              {value.length < minLength ? (
                <span className="text-red-500">Min {minLength} characters</span>
              ) : isTooLong ? (
                <span className="text-red-500">Exceeds 72 bytes limit</span>
              ) : (
                <span className="text-emerald-500 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 inline" /> Length OK
                </span>
              )}
            </span>
          </div>

          {strength.feedback?.warning && (
            <p className="text-[11px] text-amber-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{strength.feedback.warning}</span>
            </p>
          )}

          {strength.score < 3 && (
            <p className="text-[10px] text-on-surface-variant">
              Tip: Use at least 10 characters, combining letters, numbers, and symbols.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
