import { Duration, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { topLevelDomain } from '../config';
import { ColourInfra } from './colour-infra';
import { getTwoCfConfig } from './config';

export class TwoCfInfra extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const config = getTwoCfConfig()
    const blue = new ColourInfra(this, "Blue", config.blue)
    const green = new ColourInfra(this, "Green", config.green)


    const blueDistributionId = blue.dist.distributionId

    const wwwDomain = `www.${topLevelDomain}`
    const deployCode = readFileSync(config.switchFunctionAssetPath, 'utf8').split("//end")[0]

    const deployCfFunction = new Function(this, 'DeployFunction', {
      code: Code.fromInline(deployCode),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      environment: {
        BLUE_DIST_ID: blueDistributionId,
        WWW_DOMAIN: wwwDomain,
      },
      functionName: "switch-twocf",
      memorySize: 128,
      timeout: Duration.seconds(60),
    });
    deployCfFunction.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "cloudfront:Get*",
        "cloudfront:UpdateDistribution",
      ],
      resources: ["*"]
    }))

    const hostedZone = HostedZone.fromLookup(this, 'ZoneRef', { domainName: topLevelDomain });

    new ARecord(this, 'WwwAliasRecord', {
      recordName: wwwDomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(green.dist)),
      zone: hostedZone
    });
  }
}
