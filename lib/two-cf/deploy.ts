import { Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { getTwoCfConfig } from './config';

export class TwoCfDeploy extends Stack {
  constructor(scope: Construct, id: string, colour: string, props?: StackProps) {
    super(scope, id, props);

    const twoCfConfig = getTwoCfConfig()
    const colourConfig = colour === "blue" ? twoCfConfig.blue : twoCfConfig.green

    const distributionId = Fn.importValue(colourConfig.distributionIdOutput)
    const domainName = Fn.importValue(colourConfig.distributionDomainOutput)
    const distribution = Distribution.fromDistributionAttributes(this, "CdnRef", {
      distributionId,
      domainName
    })

    const siteBucketName = Fn.importValue(colourConfig.siteBucketNameOutput);
    const siteBucket = Bucket.fromBucketName(this, "SiteBucketRef", siteBucketName)
    const deployedAt = (new Date()).toISOString()
    const siteIndexFile = `<html>
    <body>
      <h1>deployed at ${deployedAt}, two cloudfront ${colour} site</h1>
    </body>
  </html>`
    new BucketDeployment(this, 'DeployWithColourInvalidation', {
      sources: [Source.data("index.html", siteIndexFile)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: [`/*`],
    })

  }
}
