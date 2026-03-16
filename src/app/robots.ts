import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/profile/', '/bookmarks/', '/dashboard/', '/api/'],
    },
    sitemap: 'https://iskraidey.com/sitemap.xml',
  }
}
