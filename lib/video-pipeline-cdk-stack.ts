import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

export class VideoPipelineCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Bucket para recibir videos
    const videoBucket = new s3.Bucket(this, 'VideoUploadBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 2. Referencias a Lambdas EXISTENTES por ARN 
    const lambda1 = lambda.Function.fromFunctionArn(this, 'Lambda1', 'arn:aws:lambda:eu-west-2:471112985974:function:createCasings');
    const lambda2 = lambda.Function.fromFunctionArn(this, 'Lambda2', 'arn:aws:lambda:eu-west-2:471112985974:function:Trascodificar-test');
    const lambda3 = lambda.Function.fromFunctionArn(this, 'Lambda3', 'arn:aws:lambda:eu-west-2:471112985974:function:videoDataBucketCRUD');

    // 3. Step Function: tareas secuenciales
    const step1 = new tasks.LambdaInvoke(this, 'InvokeLambda1', {
      lambdaFunction: lambda1,
      outputPath: '$.Payload',
    });

    const step2 = new tasks.LambdaInvoke(this, 'InvokeLambda2', {
      lambdaFunction: lambda2,
      outputPath: '$.Payload',
    });

    const step3 = new tasks.LambdaInvoke(this, 'InvokeLambda3', {
      lambdaFunction: lambda3,
      outputPath: '$.Payload',
    });

    const definition = step1.next(step2).next(step3);

    const videoProcessingStateMachine = new sfn.StateMachine(this, 'VideoPipelineStateMachine', {
      definition,
      timeout: cdk.Duration.minutes(10),
    });

    // 4. Regla de EventBridge que escucha cargas en S3
    const rule = new events.Rule(this, 'S3UploadRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [videoBucket.bucketName],
          },
          object: {
            key: [{ suffix: '.mp4' }, { suffix: '.mov' }],
          },
        },
      },
    });

    // 5. Trigger: ejecuta la Step Function
    rule.addTarget(new targets.SfnStateMachine(videoProcessingStateMachine));

    // 🔐 Permisos para que S3 → EventBridge → StepFunction funcione
    videoBucket.grantReadWrite(new cdk.aws_iam.ServicePrincipal('events.amazonaws.com'));
    videoProcessingStateMachine.grantStartExecution(new cdk.aws_iam.ServicePrincipal('events.amazonaws.com'));

    new cdk.CfnOutput(this, 'BucketName', {
      value: videoBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'StepFunctionArn', {
      value: videoProcessingStateMachine.stateMachineArn,
    });
  }
}
