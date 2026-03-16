import { type ButtonHTMLAttributes, type CSSProperties } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.875rem 2rem',
  fontSize: '1.125rem',
  fontWeight: 700,
  fontFamily: 'inherit',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'background-color 0.15s, transform 0.1s, box-shadow 0.15s',
  outline: 'none',
  userSelect: 'none',
}

const variantStyles: Record<ButtonVariant, { bg: string; bgHover: string; color: string }> = {
  primary: {
    bg: 'var(--color-primary)',
    bgHover: 'var(--color-primary-hover)',
    color: '#ffffff',
  },
  secondary: {
    bg: 'var(--color-secondary)',
    bgHover: 'var(--color-secondary-hover)',
    color: '#ffffff',
  },
  danger: {
    bg: 'transparent',
    bgHover: 'var(--color-danger)',
    color: 'var(--color-danger)',
  },
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant]

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...baseStyle,
        backgroundColor: v.bg,
        color: v.color,
        width: fullWidth ? '100%' : undefined,
        border: variant === 'danger' ? '2px solid var(--color-danger)' : 'none',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = v.bgHover
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-hover)'
          if (variant === 'danger') {
            e.currentTarget.style.color = '#ffffff'
          }
        }
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = v.bg
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
        if (variant === 'danger') {
          e.currentTarget.style.color = v.color
        }
        onMouseLeave?.(e)
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 3px ${variant === 'danger' ? 'rgba(231,76,60,0.3)' : 'rgba(74,144,217,0.4)'}`
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    />
  )
}
