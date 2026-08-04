import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout title="Documentation" description={siteConfig.tagline}>
      <main className="container margin-vert--lg">
        <Heading as="h1">Learning LocalStack</Heading>
        <p>{siteConfig.tagline}</p>
        <Link className="button button--primary" to="/docs/running-locally-with-localstack">
          Read the documentation
        </Link>
      </main>
    </Layout>
  );
}
