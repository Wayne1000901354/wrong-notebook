import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: '智能錯題本',
        short_name: '錯題本',
        description: 'AI 驅動的智能錯題管理系統，幫助學生高效整理、分析和複習錯題',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#f97316',
        orientation: 'portrait',
        icons: [
            {
                src: '/icons/icon.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    }
}
