import { Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { getOneCfConfig } from './config';

export class OneCfDeploy extends Stack {
  constructor(scope: Construct, id: string, colour: string, props?: StackProps) {
    super(scope, id, props);

    const config = getOneCfConfig()
    const colourConfig = colour === "blue" ? config.blue : config.green

    const distributionId = Fn.importValue(config.distributionIdOutput)
    const domainName = Fn.importValue(config.distributionDomainOutput)
    const distribution = Distribution.fromDistributionAttributes(this, "CdnRef", {
      distributionId,
      domainName
    })

    const siteBucketName = Fn.importValue(colourConfig.siteBucketNameOutput);
    const siteBucket = Bucket.fromBucketName(this, "SiteBucketRef", siteBucketName)
    const deployedAt = (new Date()).toISOString()
    const siteIndexFile = `<html>
    <body>
      <h1>deployed at ${deployedAt}, one cloudfront ${colour} site</h1>
    </body>
  </html>`

    const staticFile = `Deployed by ${colour} at ${deployedAt}`
    const sources = [
      Source.data("index.html", siteIndexFile),
      Source.data("static/file.txt", staticFile)
    ]
    new BucketDeployment(this, 'DeployWithColourInvalidation', {
      sources,
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: [`/_${colour}/*`],
    })

  }
}
