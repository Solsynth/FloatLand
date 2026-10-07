export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBaseUrl

  const urls: any[] = []

  // Static pages
  urls.push(
    { loc: '/', changefreq: 'daily', priority: 1.0 },
    { loc: '/membership', changefreq: 'monthly', priority: 0.8 },
    { loc: '/search', changefreq: 'weekly', priority: 0.6 },
    { loc: '/realms', changefreq: 'daily', priority: 0.7 },
    { loc: '/creators', changefreq: 'weekly', priority: 0.7 },
    { loc: '/developers', changefreq: 'weekly', priority: 0.7 }
  )

  try {
    // Fetch recent posts for sitemap
    const postsResponse = await $fetch(`${apiBaseUrl}/sn/v1/timeline/public`, {
      params: { limit: 100 }
    })

    if (postsResponse && Array.isArray(postsResponse.items)) {
      postsResponse.items.forEach((post: any) => {
        urls.push({
          loc: `/posts/${post.id}`,
          lastmod: post.updatedAt || post.createdAt,
          changefreq: 'weekly',
          priority: 0.6
        })
      })
    }
  } catch (error) {
    console.error('Failed to fetch posts for sitemap:', error)
  }

  return urls
})
