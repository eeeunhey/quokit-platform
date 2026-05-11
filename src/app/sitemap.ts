import { MetadataRoute } from 'next';
import prisma from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://quokit.site';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/developers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/weekly`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  try {
    const repos = await prisma.repository.findMany({
      select: { fullName: true, lastFetchedAt: true },
      orderBy: { starsCount: 'desc' },
      take: 500,
    });

    const repoPages: MetadataRoute.Sitemap = repos.map((repo) => ({
      url: `${baseUrl}/repo/${repo.fullName}`,
      lastModified: repo.lastFetchedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticPages, ...repoPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return staticPages;
  }
}
