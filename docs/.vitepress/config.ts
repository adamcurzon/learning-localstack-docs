import {defineConfig} from 'vitepress'

export default defineConfig({
  title: 'Learning LocalStack',
  description: 'AWS SAM, Java Lambda, and LocalStack documentation',
  base: '/learning-localstack-docs/',
  cleanUrls: true,
  themeConfig: {
    nav: [
      {
        text: 'Guides',
        items: [
          {text: 'Get started', link: '/getting-started'},
          {text: 'Local development', link: '/local-development'},
          {text: 'AWS deployment', link: '/aws-deployment'},
          {text: 'Architecture', link: '/architecture'},
          {text: 'Troubleshooting', link: '/troubleshooting'},
        ],
      },
      {
        text: 'Documentation',
        items: [
          {text: 'Changelog', link: '/changelog'},
          {text: 'API Reference', link: '/api/'},
        ],
      },
      {
        text: 'Unreleased',
        items: [
          {text: 'React frontend plan', link: '/unreleased/frontend-plan'},
        ],
      },
      {text: 'Application repository', link: 'https://github.com/adamcurzon/learning-localstack'},
    ],
    search: {
      provider: 'local',
    },
    sidebar: {
      '/': [
        {
          text: 'Guides',
          items: [
            {text: 'Getting started', link: '/getting-started'},
            {text: 'Local development with LocalStack', link: '/local-development'},
            {text: 'Deploying to AWS', link: '/aws-deployment'},
            {text: 'Architecture', link: '/architecture'},
            {text: 'Troubleshooting', link: '/troubleshooting'},
          ],
        },
        {
          text: 'Documentation',
          items: [
            {text: 'Changelog', link: '/changelog'},
            {text: 'API Reference', link: '/api/'},
          ],
        },
        {
          text: 'Unreleased',
          items: [
            {text: 'React frontend plan', link: '/unreleased/frontend-plan'},
          ],
        },
      ],
    },
    socialLinks: [
      {icon: 'github', link: 'https://github.com/adamcurzon/learning-localstack-docs'},
    ],
  },
})
