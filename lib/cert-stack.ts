import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { CertificateValidation, DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { topLevelDomain, getCertificateArnOutput } from './config';

export class CertStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromLookup(this, 'ZoneRef', { domainName: topLevelDomain });

    const certificate = new DnsValidatedCertificate(this, "Certificate", {
      domainName: topLevelDomain,
      subjectAlternativeNames: [
        `*.${topLevelDomain}`
      ],
      hostedZone,
      validation: CertificateValidation.fromDns(hostedZone),
      // region: 'us-east-1', // Cloudfront only checks this region for certificates.
    })

    new CfnOutput(this, 'CertificateOutput', {
      value: certificate.certificateArn,
      exportName: getCertificateArnOutput(),
    })

  }
}
