import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs'; // ✅ Añade esto arriba
import * as path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as dotenv from 'dotenv';

dotenv.config();
export class VideoPipelineCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    // 1. Bucket para recibir videos
    const videoBucket = s3.Bucket.fromBucketName(this, 'VideoUploadBucket', 'videos-tantra-shivaita');

    // 2. Referencias a Lambdas EXISTENTES por ARN 
    const lambda1 = lambda.Function.fromFunctionArn(this, 'Lambda1', 'arn:aws:lambda:eu-west-2:471112985974:function:createCasings');
    const lambda2 = lambda.Function.fromFunctionArn(this, 'Lambda2', 'arn:aws:lambda:eu-west-2:471112985974:function:Trascodificar-test');
    const lambda3 = lambda.Function.fromFunctionArn(this, 'Lambda3', 'arn:aws:lambda:eu-west-2:471112985974:function:videoDataBucketCRUD');

    // 3. Step Function: tareas secuenciales
    const step1 = new tasks.LambdaInvoke(this, 'InvokeLambda1', {
      lambdaFunction: lambda1,
      inputPath: '$',
      outputPath: '$.Payload' // ✅ sobrescribe output con Payload
    });
    
    const step2 = new tasks.LambdaInvoke(this, 'InvokeLambda2', {
      lambdaFunction: lambda2,
      outputPath: '$.Payload'
    });
    
    const step3 = new tasks.LambdaInvoke(this, 'InvokeLambda3', {
      lambdaFunction: lambda3,
      outputPath: '$.Payload'
    });

    const definition = step1.next(step2).next(step3);

    const videoProcessingStateMachine = new sfn.StateMachine(this, 'VideoPipelineStateMachine', {
      definition,
      timeout: cdk.Duration.minutes(10),
    });

    // 6. Referencia a la tabla de DynamoDB (ya existente)
    const videoTable = dynamodb.Table.fromTableAttributes(this, 'VideoDataBucket', {
      tableName: 'videoDataBucket',
      tableStreamArn: 'arn:aws:dynamodb:eu-west-2:471112985974:table/videoDataBucket/stream/2025-04-14T05:58:44.982',
    });
    // 7. Lambda que escucha el stream y lanza notificaciones a AppSync
    const notifyAppsyncFn = new NodejsFunction(this, 'NotifyVideoUpdateToAppSync', {
      entry: path.join(__dirname, '../lambdas/notify-appsync/index.mjs'),
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      environment: {
        APPSYNC_URL:     process.env.APPSYNC_URL!,
        APPSYNC_API_KEY: process.env.APPSYNC_API_KEY!,  // ✅ aquí
        AWS_ACCOUNT_ID:  this.account,
      },
      bundling: {
        format: OutputFormat.ESM, // ✅ Y úsalo así
        minify: false,
        sourcesContent: true,
        target: 'es2022',
      }
    });

    // 8. Conectar la Lambda al stream de DynamoDB
    videoTable.grantStreamRead(notifyAppsyncFn);

    notifyAppsyncFn.addEventSourceMapping('VideoDataStreamMapping', {
      eventSourceArn: videoTable.tableStreamArn!,
      startingPosition: lambda.StartingPosition.LATEST,
    });

    // 9. Permisos para llamar a AppSync
    notifyAppsyncFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['appsync:GraphQL'],
        resources: [
          `arn:aws:appsync:eu-west-2:${process.env.AWS_ACCOUNT_ID}:apis/${process.env.APPSYNC_API_ID}/*`
        ]
      })
    );

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
    rule.addTarget(new targets.SfnStateMachine(videoProcessingStateMachine, {
      input: events.RuleTargetInput.fromObject({
        videoKey: events.EventField.fromPath('$.detail.object.key')
      })
    }));


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
