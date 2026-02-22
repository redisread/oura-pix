'use client';

import { useState, useEffect } from 'react';

/**
 * 语言切换器组件
 * 支持英语、中文切换
 */

const languages = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export default function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('zh');
  const [isOpen, setIsOpen] = useState(false);

  // 从 cookie 中读取语言设置
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const langCookie = cookies.find(c => c.trim().startsWith('language='));
    if (langCookie) {
      const lang = langCookie.split('=')[1];
      setCurrentLang(lang);
    } else {
      // 检测浏览器语言
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        setCurrentLang('zh');
      } else {
        setCurrentLang('en');
      }
    }
  }, []);

  // 切换语言
  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    document.cookie = `language=${langCode}; path=/; max-age=31536000`; // 1年有效期
    setIsOpen(false);

    // 刷新页面以应用新语言
    // 实际项目中这里应该使用更优雅的方式，比如重新加载翻译文件
    window.location.reload();
  };

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

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
