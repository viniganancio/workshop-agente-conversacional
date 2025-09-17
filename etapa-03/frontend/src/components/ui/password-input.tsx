import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  showStrengthIndicator?: boolean;
  id?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  onValidationChange,
  label = "Senha",
  placeholder = "Sua senha",
  disabled = false,
  required = true,
  showStrengthIndicator = true,
  id = "password"
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  const validation = validatePassword(value);

  useEffect(() => {
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (!hasBeenTouched && newValue.length > 0) {
      setHasBeenTouched(true);
    }
  };

  const shouldShowValidation = hasBeenTouched || isFocused;
  const strengthPercent = Math.max(0, (validation.score / 6) * 100);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pr-10",
            shouldShowValidation && !validation.isValid && value.length > 0 
              ? "border-red-500 focus:border-red-500" 
              : shouldShowValidation && validation.isValid && value.length > 0
              ? "border-green-500 focus:border-green-500"
              : ""
          )}
          disabled={disabled}
          required={required}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          disabled={disabled}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrengthIndicator && value.length > 0 && shouldShowValidation && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  getPasswordStrengthColor(validation.strength)
                )}
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-medium",
              validation.strength === 'weak' ? 'text-red-600' :
              validation.strength === 'medium' ? 'text-yellow-600' :
              'text-green-600'
            )}>
              {getPasswordStrengthText(validation.strength)}
            </span>
          </div>

          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <X className="h-3 w-3 text-red-500 flex-shrink-0" />
                  <span className="text-red-600">{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Success indicators */}
          {value.length > 0 && (
            <div className="space-y-1">
              {[
                { check: value.length >= 8, text: "Pelo menos 8 caracteres" },
                { check: /[a-z]/.test(value), text: "Letra minúscula" },
                { check: /[A-Z]/.test(value), text: "Letra maiúscula" },
                { check: /\d/.test(value), text: "Número" },
                { check: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(value), text: "Caractere especial" }
              ].map((requirement, index) => (
                requirement.check && (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span className="text-green-600">{requirement.text}</span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};