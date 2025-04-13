#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VideoPipelineCdkStack } from '../lib/video-pipeline-cdk-stack';
import * as dotenv from 'dotenv';

// 👇 Cargamos variables de .env (si lo tienes)
dotenv.config();

const app = new cdk.App();

// 💥 Creamos la app de CDK con los datos de cuenta y región
// Si tienes `.env`, agarra de ahí; si no, usa las de la CLI
new VideoPipelineCdkStack(app, 'VideoPipelineCdkStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-west-2',
  },
});
