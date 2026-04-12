import nextVitals from 'eslint-config-next/core-web-vitals';

const config = nextVitals.map((entry) => {
  if (entry.name === 'next') {
    return {
      ...entry,
      rules: {
        ...entry.rules,
        'react/display-name': 'warn',
        'react/no-unescaped-entities': 'warn',
        'react-hooks/set-state-in-effect': 'off',
        'react-hooks/immutability': 'off',
        'react-hooks/purity': 'off',
        'import/no-anonymous-default-export': 'off',
      },
    };
  }

  if (entry.name === 'next/core-web-vitals') {
    return {
      ...entry,
      rules: {
        ...entry.rules,
        '@next/next/no-html-link-for-pages': 'warn',
      },
    };
  }

  if (entry.name === 'next/typescript') {
    return {
      ...entry,
      rules: {
        ...entry.rules,
        '@typescript-eslint/no-explicit-any': 'off',
      },
    };
  }

  return entry;
});

config.push({
  ignores: [
    '.next/**',
    'node_modules/**',
    'public/**',
    'coverage/**',
    'dist/**',
    'build/**',
    'scripts/**',
    'prisma/**',
    'src/generated/**',
    'next-env.d.ts',
  ],
});

export default config;
