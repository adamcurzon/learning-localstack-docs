import {defineConfig} from 'vitepress'

export default defineConfig({
  title: 'Learning LocalStack',
  description: 'AWS SAM, Java Lambda, and LocalStack documentation',
  base: '/learning-localstack-docs/',
  cleanUrls: true,
  themeConfig: {
    nav: [
      {text: 'Guides', link: '/running-locally-with-localstack'},
      {text: 'API Reference', link: '/api/'},
      {text: 'Application repository', link: 'https://github.com/adamcurzon/learning-localstack'},
    ],
    search: {
      provider: 'local',
    },
    sidebar: {
      '/api/': [
        {
          text: 'API Reference',
          items: [{text: 'Hello World API', link: '/api/'}],
        },
      ],
      '/': [
        {
          text: 'Guides',
          items: [
            {text: 'Running locally with LocalStack', link: '/running-locally-with-localstack'},
            {text: 'Live AWS deployment', link: '/aws-live-deployment'},
            {text: 'AWS setup plan', link: '/aws-setup-plan'},
            {text: 'SAM and LocalStack plan', link: '/aws-sam-localstack-lambda-plan'},
          ],
        },
      ],
    },
    socialLinks: [
      {icon: 'github', link: 'https://github.com/adamcurzon/learning-localstack-docs'},
    ],
  },
})
