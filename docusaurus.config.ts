import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Learning LocalStack',
  tagline: 'AWS SAM, Java Lambda, and LocalStack documentation',
  favicon: 'img/favicon.ico',
  future: {v4: true},
  url: 'https://adamcurzon.github.io',
  baseUrl: '/learning-localstack-docs/',
  organizationName: 'adamcurzon',
  projectName: 'learning-localstack-docs',
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/adamcurzon/learning-localstack-docs/edit/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Learning LocalStack',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/adamcurzon/learning-localstack',
          label: 'Application repository',
          position: 'right',
        },
        {
          href: 'https://github.com/adamcurzon/learning-localstack-docs',
          label: 'Docs repository',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {label: 'Start here', to: '/docs/running-locally-with-localstack'},
            {label: 'AWS setup', to: '/docs/aws-setup-plan'},
          ],
        },
        {
          title: 'Repositories',
          items: [
            {
              label: 'Application',
              href: 'https://github.com/adamcurzon/learning-localstack',
            },
            {
              label: 'Documentation',
              href: 'https://github.com/adamcurzon/learning-localstack-docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Learning LocalStack.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
