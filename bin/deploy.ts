#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OneCfDeploy } from '../lib/one-cf/deploy';
import { OneCfInfra } from '../lib/one-cf/infra';
import { TwoCfDeploy } from '../lib/two-cf/deploy';
import { TwoCfInfra } from '../lib/two-cf/infra';
import { appName, getAwsAccount, getAwsRegion } from '../lib/config';
import { CertStack } from '../lib/cert-stack';

const account = getAwsAccount()
const region = getAwsRegion()

const app = new cdk.App();

const env = { account, region }

new CertStack(app, `${appName}-cert`, { env })

new OneCfInfra(app, `${appName}-onecf-infra`, { env })

new OneCfDeploy(app, `${appName}-onecf-blue`, "blue", { env })

new OneCfDeploy(app, `${appName}-onecf-green`, "green", { env })


new TwoCfInfra(app, `${appName}-twocf-infra`, { env })

new TwoCfDeploy(app, `${appName}-twocf-blue`, "blue", { env })

new TwoCfDeploy(app, `${appName}-twocf-green`, "green", { env })
