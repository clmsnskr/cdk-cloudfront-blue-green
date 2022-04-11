import { CfnOutput, Duration, Fn, PhysicalName, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CachePolicy, Distribution, LambdaEdgeEventType } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ARecord, HostedZone, RecordTarget, TxtRecord } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';
import {
  blueBNToken,
  greenBNToken,
  percentGreenDomainToken,
} from '../../url-rewrite';
import { getCertificateArnOutput, topLevelDomain } from '../config';
import { getOneCfConfig } from './config';
const cf = require('aws-cdk-lib/aws-cloudfront')

const percentGreenDomain = `percentgreen.${topLevelDomain}`

const getUrlRewriteCode = (urlRewriteAssetPath: string, blueSiteBucket: string, greenSiteBucket: string) => {

  const urlRewriteCode = readFileSync(urlRewriteAssetPath, 'utf8')

  const replacedCode = urlRewriteCode.
    replace(percentGreenDomainToken, percentGreenDomain).
    replace(blueBNToken, blueSiteBucket).
    replace(greenBNToken, greenSiteBucket)

  const code = replacedCode.split("//end")[0]

  return code
}

const getSiteBucket = (scope: Construct, bucketId: string) => {
  const siteBucket = new Bucket(scope, bucketId, {
    websiteIndexDocument: 'index.html',
    websiteErrorDocument: 'index.html',
    // shouldn't need this but the OAI doesn't seem to work...
    publicReadAccess: true,
    autoDeleteObjects: true,
    removalPolicy: RemovalPolicy.DESTROY,
    bucketName: PhysicalName.GENERATE_IF_NEEDED,
  });

  return siteBucket
}

export class OneCfInfra extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const config = getOneCfConfig()

    const blueSiteBucket = getSiteBucket(this, "BlueSiteBucket")
    const greenSiteBucket = getSiteBucket(this, "GreenSiteBucket")

    const certificateArn = Fn.importValue(getCertificateArnOutput());
    const certificate = Certificate.fromCertificateArn(this, "CertRef", certificateArn)

    const urlRewriteCode = getUrlRewriteCode(
      config.urlRewriteAssetPath,
      blueSiteBucket.bucketName,
      greenSiteBucket.bucketName)

    // don't specify name of url rewrite function because it takes an hour or so to be able to delete the function which makes spinning up/down harder
    const urlRewriteFunction = new cf.experimental.EdgeFunction(this, "UrlRewriteFunction", {
      code: Code.fromInline(urlRewriteCode),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 128,
      timeout: Duration.seconds(5)
    })
    const urlRewriteFunctionVersion = urlRewriteFunction.currentVersion

    const edgeLambdas = [
      {
        eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
        functionVersion: urlRewriteFunctionVersion,
      }
    ]

    const distribution = new Distribution(this, "SiteDistribution", {
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        }
      ],
      domainNames: [
        config.wwwDomain,
        config.rootDomain
      ],
      certificate,
      defaultBehavior: {
        origin: new S3Origin(blueSiteBucket, {}),
        edgeLambdas,
        cachePolicy: CachePolicy.CACHING_DISABLED
      },
      additionalBehaviors: {
        "/_blue/*": {
          origin: new S3Origin(blueSiteBucket, {}),
          edgeLambdas,
        },
        "/_green/*": {
          origin: new S3Origin(greenSiteBucket, {}),
          edgeLambdas,
        },
      }
    });

    const hostedZone = HostedZone.fromLookup(this, 'ZoneRef', { domainName: topLevelDomain });

    const deployCode = readFileSync(config.switchFunctionAssetPath, 'utf8').split("//end")[0]

    const deployOneCfFunction = new Function(this, 'DeployOneCfFunction', {
      code: Code.fromInline(deployCode),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      environment: {
        PERCENT_GREEN_DOMAIN: percentGreenDomain,
        HOSTED_ZONE_ID: hostedZone.hostedZoneId
      },
      functionName: "switch-onecf",
      memorySize: 128,
      timeout: Duration.seconds(60),
    });
    deployOneCfFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["route53:ChangeResourceRecordSets"],
      resources: ["*"]
    }))

    new TxtRecord(this, 'AliasRecord', {
      recordName: percentGreenDomain,
      values: ["0"],
      ttl: Duration.seconds(60),
      zone: hostedZone
    });

    new ARecord(this, 'WwwAliasRecord', {
      recordName: config.wwwDomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone
    });

    new ARecord(this, 'RootAliasRecord', {
      recordName: config.rootDomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: hostedZone
    });


    new CfnOutput(this, 'BlueSiteBucketNameOutput', {
      value: blueSiteBucket.bucketName,
      exportName: config.blue.siteBucketNameOutput,
    })

    new CfnOutput(this, 'GreenSiteBucketNameOutput', {
      value: greenSiteBucket.bucketName,
      exportName: config.green.siteBucketNameOutput,
    })

    new CfnOutput(this, 'DistributionIdOutput', {
      value: distribution.distributionId,
      exportName: config.distributionIdOutput,
    })

    new CfnOutput(this, 'DistributionDomainNameOutput', {
      value: distribution.distributionDomainName,
      exportName: config.distributionDomainOutput,
    })

  }
}
