import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full w-10 h-10 bg-secondary flex items-center justify-center"
        title={user.email}
      >
        {/* 可以用 user.name[0] 當作頭像字母 */}
        <span className="text-lg font-bold text-foreground">
          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-background border rounded shadow-lg z-50 text-foreground">
          <div className="px-4 py-2 text-sm border-b">{user.email}</div>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={async () => {
              await logout();
              setOpen(false);
            }}
          >
            登出
          </button>
        </div>
      )}
    </div>
  );
}
