'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';

/**
 * 语言切换器组件
 * 使用 Radix UI DropdownMenu 实现
 * 支持英语、中文切换
 */

const languages = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

// 获取初始语言的辅助函数
function getInitialLang(): string {
  if (typeof document === 'undefined') return 'zh';
  const cookies = document.cookie.split(';');
  const langCookie = cookies.find(c => c.trim().startsWith('language='));
  if (langCookie) {
    return langCookie.split('=')[1];
  }
  // 检测浏览器语言
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('zh');
  const [mounted, setMounted] = useState(false);

  // 初始化语言设置
  useEffect(() => {
    setCurrentLang(getInitialLang());
    setMounted(true);
  }, []);

  // 切换语言
  const handleLanguageChange = useCallback((langCode: string) => {
    setCurrentLang(langCode);

    // 设置 cookie 并刷新页面
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `language=${langCode}; path=/; expires=${expires.toUTCString()}`;

    // 刷新页面以应用新语言
    window.location.reload();
  }, []);

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
      >
        <span className="text-base">🇨🇳</span>
        <span className="hidden sm:inline">中文</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Select language"
        >
          <span className="text-base" aria-hidden="true">
            {currentLanguage.flag}
          </span>
          <span className="hidden sm:inline">{currentLanguage.name}</span>
          <span className="sm:hidden uppercase">{currentLanguage.code}</span>
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden="true">
                {language.flag}
              </span>
              <span>{language.name}</span>
            </div>
            {language.code === currentLang && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}