'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 语言切换器组件
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
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 初始化语言设置
  useEffect(() => {
    setCurrentLang(getInitialLang());
    setMounted(true);
  }, []);

  // 切换语言
  const handleLanguageChange = useCallback((langCode: string) => {
    setCurrentLang(langCode);
    setIsOpen(false);

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
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        >
          <span className="text-base">🇨🇳</span>
          <span className="hidden sm:inline">中文</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-base" aria-hidden="true">
          {currentLanguage.flag}
        </span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <span className="sm:hidden uppercase">{currentLanguage.code}</span>
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* 点击外部关闭 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* 下拉菜单 */}
          <div className="absolute right-0 z-20 w-32 mt-2 origin-top-right bg-background border border-border rounded-md shadow-lg">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors ${
                    language.code === currentLang
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span className="mr-2 text-base" aria-hidden="true">
                    {language.flag}
                  </span>
                  {language.name}
                  {language.code === currentLang && (
                    <svg
                      className="w-4 h-4 ml-auto text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}