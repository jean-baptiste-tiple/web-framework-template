// Registre des auteurs. La clé est référencée par `author` dans le frontmatter blog.
export interface Author {
  name: string;
  role?: string;
  url?: string;
  // Profils externes (LinkedIn, etc.) → renforce le signal d'autorité (JSON-LD sameAs).
  sameAs?: string[];
}

export const AUTHORS: Record<string, Author> = {
  jb: {
    name: 'Jean-Baptiste',
    role: 'Co-fondateur',
    url: 'https://example.com/a-propos',
    sameAs: [],
  },
};

export function getAuthor(key: string): Author {
  return AUTHORS[key] ?? { name: key };
}
