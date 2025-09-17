import React, { useState, useEffect } from 'react';
import { Mail, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateEmail } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChange,
  onValidationChange,
  label = "E-mail",
  placeholder = "seu@email.com",
  disabled = false,
  required = true,
  id = "email"
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  const validation = validateEmail(value);

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

  const shouldShowValidation = hasBeenTouched && !isFocused;
  const showSuccess = shouldShowValidation && validation.isValid && value.length > 0;
  const showError = shouldShowValidation && !validation.isValid && value.length > 0;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          id={id}
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pl-10 pr-10",
            showError 
              ? "border-red-500 focus:border-red-500" 
              : showSuccess
              ? "border-green-500 focus:border-green-500"
              : ""
          )}
          disabled={disabled}
          required={required}
        />
        
        {/* Validation Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {showSuccess && (
            <Check className="h-4 w-4 text-green-500" />
          )}
          {showError && (
            <X className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Error Message */}
      {showError && validation.error && (
        <div className="flex items-center space-x-2 text-xs">
          <X className="h-3 w-3 text-red-500 flex-shrink-0" />
          <span className="text-red-600">{validation.error}</span>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="flex items-center space-x-2 text-xs">
          <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
          <span className="text-green-600">E-mail válido</span>
        </div>
      )}

      {/* Helper Text */}
      {isFocused && value.length === 0 && (
        <div className="text-xs text-gray-500">
          Digite um e-mail válido (exemplo: usuario@provedor.com)
        </div>
      )}
    </div>
  );
};