export type Language = 'ar' | 'en'

export const translations = {
  ar: {
    // General
    appName: 'سطح المكتب',
    settings: 'الإعدادات',
    close: 'إغلاق',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    reset: 'إعادة ضبط',
    search: 'بحث...',
    searchPlaceholder: 'ابحث عن أيقونة...',
    noResults: 'لا توجد نتائج',

    // Context menu
    addIcon: 'إضافة أيقونة',
    openLink: 'فتح الرابط',
    editIcon: 'تعديل الأيقونة',
    deleteIcon: 'حذف الأيقونة',
    autoAlign: 'ترتيب تلقائي',
    resetDesktop: 'إعادة ضبط سطح المكتب',
    exportLayout: 'تصدير التخطيط',
    importLayout: 'استيراد التخطيط',

    // Icon modal
    addNewIcon: 'إضافة أيقونة جديدة',
    editIconTitle: 'تعديل الأيقونة',
    iconLabel: 'اسم الأيقونة',
    iconLabelAr: 'الاسم بالعربية',
    iconUrl: 'رابط الموقع',
    iconImage: 'رابط الصورة',
    iconImagePlaceholder: 'https://logo.com/icon.png',
    uploadIconImage: 'رفع صورة من الجهاز',
    orEnterUrl: 'أو أدخل رابط URL',
    orEnterEmoji: 'أو أدخل رابط صورة',

    // Settings sections
    desktopSettings: 'إعدادات سطح المكتب',
    iconSettings: 'إعدادات الأيقونات',
    interfaceSettings: 'إعدادات الواجهة',
    themeLanguage: 'المظهر واللغة',

    // Desktop settings
    wallpaper: 'خلفية سطح المكتب',
    uploadWallpaper: 'رفع خلفية',
    wallpaperBlur: 'ضبابية الخلفية',
    showGrid: 'إظهار الشبكة',
    desktopPadding: 'هامش سطح المكتب',

    // Icon settings
    iconSize: 'حجم الأيقونة',
    iconSpacing: 'المسافة بين الأيقونات',
    labelSize: 'حجم النص',
    labelColor: 'لون النص',
    hoverAnimation: 'تأثير التحويم',
    animNone: 'بدون',
    animScale: 'تكبير',
    animBounce: 'ارتداد',
    animGlow: 'توهج',
    animLift: 'رفع',

    // Interface settings
    enableAnimations: 'تفعيل الحركات',
    uiBlur: 'ضبابية الواجهة',
    cornerRadius: 'زوايا مدورة',

    // Theme
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'الإنجليزية',

    // Confirm
    confirmReset: 'هل أنت متأكد من إعادة ضبط سطح المكتب؟ سيتم حذف جميع الأيقونات.',
    confirmDelete: 'هل تريد حذف هذه الأيقونة؟',
    yes: 'نعم',
    no: 'لا',
  },
  en: {
    appName: 'Desktop',
    settings: 'Settings',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    reset: 'Reset',
    search: 'Search...',
    searchPlaceholder: 'Search icons...',
    noResults: 'No results found',

    contextMenu: 'Context Menu',
    addIcon: 'Add Icon',
    openLink: 'Open Link',
    editIcon: 'Edit Icon',
    deleteIcon: 'Delete Icon',
    autoAlign: 'Auto Align',
    resetDesktop: 'Reset Desktop',
    exportLayout: 'Export Layout',
    importLayout: 'Import Layout',

    addNewIcon: 'Add New Icon',
    editIconTitle: 'Edit Icon',
    iconLabel: 'Icon Label',
    iconLabelAr: 'Label in Arabic',
    iconUrl: 'Website URL',
    iconImage: 'Image URL',
    iconLabelPlaceholder: 'e.g. Google',
    iconLabelArPlaceholder: 'e.g. جوجل',
    iconUrlPlaceholder: 'https://www.example.com',
    iconImagePlaceholder: 'https://logo.com/icon.png',
    uploadIconImage: 'Upload from device',
    orEnterUrl: 'Or enter a URL',
    orEnterEmoji: 'Or enter an image URL',

    desktopSettings: 'Desktop Settings',
    iconSettings: 'Icon Settings',
    interfaceSettings: 'Interface Settings',
    themeLanguage: 'Theme & Language',

    wallpaper: 'Wallpaper',
    uploadWallpaper: 'Upload Wallpaper',
    wallpaperBlur: 'Wallpaper Blur',
    showGrid: 'Show Grid',
    desktopPadding: 'Desktop Padding',

    iconSize: 'Icon Size',
    iconSpacing: 'Icon Spacing',
    labelSize: 'Label Size',
    labelColor: 'Label Color',
    hoverAnimation: 'Hover Animation',
    animNone: 'None',
    animScale: 'Scale',
    animBounce: 'Bounce',
    animGlow: 'Glow',
    animLift: 'Lift',

    enableAnimations: 'Enable Animations',
    uiBlur: 'UI Blur Intensity',
    cornerRadius: 'Corner Radius',

    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    arabic: 'Arabic',
    english: 'English',

    confirmReset: 'Are you sure you want to reset the desktop? All icons will be removed.',
    confirmDelete: 'Delete this icon?',
    yes: 'Yes',
    no: 'No',
  },
} as const

export type TranslationKey = keyof typeof translations.en

export function t(lang: Language, key: TranslationKey): string {
  return (translations[lang] as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key
}
