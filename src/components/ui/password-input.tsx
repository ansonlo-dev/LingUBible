import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/hooks/useLanguage"

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const { language } = useLanguage()

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    // 簡單的翻譯對象
    const translations = {
      en: {
        show: 'Show password',
        hide: 'Hide password'
      },
      'zh-TW': {
        show: '顯示密碼',
        hide: '隱藏密碼'
      },
      'zh-CN': {
        show: '显示密码',
        hide: '隐藏密码'
      }
    }

    const t = translations[language] || translations.en

    // 分離flex相關的類和其他類
    const flexClasses = className?.split(' ').filter(cls => 
      cls.includes('flex') || cls.includes('grow') || cls.includes('shrink') || cls.includes('basis')
    ).join(' ') || ''
    
    const inputClasses = className?.split(' ').filter(cls => 
      !cls.includes('flex') && !cls.includes('grow') && !cls.includes('shrink') && !cls.includes('basis')
    ).join(' ') || ''

    return (
      <div className={cn("relative", flexClasses)}>
        <input
          type={showPassword ? "text" : "password"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            inputClasses
          )}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? t.hide : t.show}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput } 