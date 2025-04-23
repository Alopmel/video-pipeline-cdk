# 🎥 Video Processing Pipeline + Notificaciones a AppSync (con AWS CDK)

Este proyecto define una infraestructura en AWS usando **AWS CDK v2** con **TypeScript**.  
Es un pipeline **serverless** para procesar vídeos y notificar al frontend en tiempo real usando AppSync.  
Todo es **Infrastructure as Code (IaC)**, ideal para escalar y mantener fácilmente. 🧠⚡️

---

## ✅ ¿Qué hace?

- 🎬 Procesa automáticamente los vídeos subidos a un bucket S3
- 🪄 Ejecuta **3 funciones Lambda ya existentes** de forma secuencial mediante Step Functions
- 🔁 Usa **DynamoDB Streams** para detectar cambios en una tabla existente (`videoDataBucket`)
- 📣 Lanza una Lambda que hace un `mutation` en **AppSync (GraphQL)** para notificar al frontend en tiempo real
- 📦 Todo gestionado con CDK

---

## 📁 Estructura del Proyecto

```bash
video-pipeline-cdk/
│
├── bin/
│   └── video-pipeline-cdk.ts              # Entry point
│
├── lib/
│   └── video-pipeline-cdk-stack.ts        # Stack principal con S3, SFN, Lambda, Dynamo, AppSync
│
├── lambdas/
│   └── notify-appsync/
│       └── index.mjs                      # Lambda que envía el mutation a AppSync
│
├── .env                                   # Contiene APPSYNC_URL, API_ID, AWS_ACCOUNT_ID
├── package.json
├── tsconfig.json
└── cdk.json
```

---

## ⚙️ Requisitos Previos

- Node.js `18.x` o superior (preferiblemente `22.x`)
- AWS CLI configurado (`aws configure`)
- AWS CDK v2 (`npm install -g aws-cdk`)
- Una tabla DynamoDB ya existente (`videoDataBucket`)
- Una GraphQL API creada con AWS Amplify (AppSync)
- Permisos adecuados (Lambda, DynamoDB, AppSync, Step Functions)

---

## 📦 Instalación

```bash
git clone https://github.com/tu-org/video-pipeline-cdk.git
cd video-pipeline-cdk
npm install
aws configure
npm install -g aws-cdk

```

---

## 🔐 Configuración de entorno (.env)

Crea un archivo `.env` en la raíz del proyecto con este contenido:

```ini
APPSYNC_URL=https://<TU_API_ID>.appsync-api.eu-west-2.amazonaws.com/graphql
AWS_ACCOUNT_ID=<TU_ACCOUNT_ID>
APPSYNC_API_ID=<TU_API_ID>

CDK_DEFAULT_ACCOUNT=<TU_DEFAULT_ACCOUNT>
CDK_DEFAULT_REGION=<TU_DEFAULT_REGIO>

```

Puedes encontrar `APPSYNC_URL` desde el panel de Amplify > AppSync.

---

## 🧠 Explicación de los Recursos

### 1. Bucket S3

Detecta subidas de vídeos `.mp4` o `.mov` y lanza una regla de **EventBridge**.

### 2. Step Function

Cadena de 3 Lambdas ya existentes, orquestadas para procesar el vídeo.

### 3. DynamoDB Stream

Se activa cuando hay un `INSERT` o `MODIFY` en la tabla `videoDataBucket`.

### 4. Lambda AppSync Notifier

Se activa al final: escucha el Stream y hace un `mutation` a AppSync para notificar al frontend React.

### 5. CDK Bootstrap

Antes de desplegar, necesitas preparar tu cuenta AWS:

```bash
cdk bootstrap
```

Esto crea un stack llamado CDKToolkit, que contiene:

- Un bucket S3 para almacenar código de Lambdas, assets, etc.
- Roles IAM usados por CDK
- Parámetros SSM para compatibilidad
- ✅ Se ejecuta una vez por cuenta/región.

---

## 🛠️ Comandos útiles

```bash
npm run build          # Transpila TypeScript
npx cdk synth          # Genera CloudFormation
npx cdk deploy         # 🚀 Despliega la infraestructura
npx cdk destroy        # 🔥 Elimina la infraestructura



```

---

## 🧪 Prueba en Tiempo Real (sin redeploy de frontend)

1. Inserta un nuevo vídeo (manualmente o desde Lambda)
2. La tabla DynamoDB dispara su Stream
3. La Lambda lanza un `mutation` al GraphQL API
4. El frontend que tenga una `subscription` activa recibe el nuevo dato automáticamente
5. 🎉 ¡Se actualiza el listado sin recargar la página!

---

## Testeo
```bash
{
    "Records": [
      {
        "eventID": "1",
        "eventName": "INSERT",
        "eventVersion": "1.0",
        "eventSource": "aws:dynamodb",
        "awsRegion": "eu-west-2",
        "dynamodb": {
          "Keys": {
            "id": { "S": "12345" }
          },
          "NewImage": {
            "id": { "S": "12345" },
            "title": { "S": "Nuevo Video" },
            "category": { "S": "Educación" }
          },
          "StreamViewType": "NEW_AND_OLD_IMAGES",
          "SequenceNumber": "111",
          "SizeBytes": 26
        },
        "eventSourceARN": "arn:aws:dynamodb:eu-west-2:471112985974:table/videoDataBucket/stream/2025-04-14T05:58:44.982"
      }
    ]
  }
```
1. Invocar la función Lambda con el evento
Este comando invoca la función Lambda utilizando el archivo event.json como payload.
```bash
aws lambda invoke `
  --function-name VideoPipelineCdkStack-NotifyVideoUpdateToAppSyncFD-58cSu8evBcOk `
  --payload file://event.json `
  response.json
```
- function-name: Especifica el nombre de la función Lambda que deseas invocar.
- payload: Proporciona el archivo event.json como entrada simulada.
- response.json: Guarda la respuesta de la función Lambda en este archivo.

3. Revisar los logs en CloudWatch
Si necesitas más detalles sobre la ejecución, puedes revisar los logs de la función Lambda en CloudWatch:
```
aws logs tail /aws/lambda/VideoPipelineCdkStack-NotifyVideoUpdateToAppSyncFD-58cSu8evBcOk --follow
```
- --follow: Muestra los logs en tiempo real.
4. Validar los mapeos de DynamoDB Stream
Si necesitas verificar que el mapeo entre DynamoDB y la función Lambda está configurado correctamente, usa este comando:
```bash
aws lambda list-event-source-mappings `
  --event-source-arn arn:aws:dynamodb:eu-west-2:471112985974:table/videoDataBucket/stream/2025-04-14T05:58:44.982 `
  --function-name VideoPipelineCdkStack-NotifyVideoUpdateToAppSyncFD-58cSu8evBcOk
```

-

4. Validar los mapeos de DynamoDB Stream
Si necesitas verificar que el mapeo entre DynamoDB y la función Lambda está configurado correctamente, usa este comando:
```bash
aws lambda list-event-source-mappings `
  --event-source-arn arn:aws:dynamodb:eu-west-2:471112985974:table/videoDataBucket/stream/2025-04-14T05:58:44.982 `
  --function-name VideoPipelineCdkStack-NotifyVideoUpdateToAppSyncFD-58cSu8evBcOk
```

---


# 🐞 Errores comunes y soluciones

## ❌ cdk bootstrap falla con bucket existente
Mensaje:

```bash
cdk-hnb659fds-assets-... already exists
```

---

## ✅ Solución:

- Borra el bucket conflictivo en S3
- Elimina la stack CDKToolkit en CloudFormation
- Ejecuta de nuevo 

```bash
cdk bootstrap
```

---

## ❌ SSM parameter /cdk-bootstrap/hnb659fds/version not found

Mensaje:

```bash
Has the environment been bootstrapped?
```

---

## ✅ Solución:

Verifica que ejecutaste cdk bootstrap con el IAM correcto, no el root

Comprueba tu identidad con:

```bash
aws sts get-caller-identity
```

### ❌ ValidationError: DynamoDB Streams must be enabled

**Solución:** activa el Stream manualmente desde la consola de AWS:

> Tabla → Exportaciones y flujos → Activar → "Nuevas y viejas imágenes"

Luego, en tu CDK usa `Table.fromTableAttributes` con el `tableStreamArn`.

---

### ❌ CDK synth error: `--app is required`

**Solución:** Asegúrate de que tu `cdk.json` tenga:

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/video-pipeline-cdk.ts"
}
```

---
 
## Proyecto Escuela Online

<!-- Contenido existente del README.md -->

## Problema conocido: error en Lambda `NotifyVideoUpdateToAppSync`

Al desplegar la función Lambda encargada de notificar a AppSync (`NotifyVideoUpdateToAppSync`), en los logs de CloudWatch aparece repetidamente el siguiente error durante la inicialización o la invocación:

```
Error: Dynamic require of "@smithy/util-utf8" is not supported
```

Como el batch de DynamoDB Stream nunca se marca como procesado tras el fallo, la misma entrada se reprocesa una y otra vez, generando invocaciones y errores continuos.

### Solución temporal

Si `--function-name` no devuelve mappings (por ejemplo, porque el nombre real de la función incluye prefijos de CloudFormation), puedes listar y borrar el mapeo usando el **ARN del Stream** directo:

```bash
# Listar mappings asociados al ARN de tu Stream de DynamoDB
aws lambda list-event-source-mappings \
  --event-source-arn arn:aws:dynamodb:eu-west-2:471112985974:table/videoDataBucket/stream/2025-04-14T05:58:44.982
```

# Elimina el mapping usando el UUID obtenido (p. ej. c300158a-45f2-48b3-a3da-abd05265c4ae)
```bash
aws lambda delete-event-source-mapping \
  --uuid c300158a-45f2-48b3-a3da-abd05265c4ae
```

**Ejemplo de salida**:
```json
{
  "EventSourceMappings": [
    {
      "UUID": "c300158a-45f2-48b3-a3da-abd05265c4ae",
      "EventSourceArn": "arn:aws:dynamodb:eu-west-2:471112985974:table/videoDataBucket/stream/2025-04-14T05:58:44.982",
      "FunctionArn": "arn:aws:lambda:eu-west-2:471112985974:function:VideoPipelineCdkStack-NotifyVideoUpdateToAppSyncFD-58cSu8evBcOk",
      "LastProcessingResult": "PROBLEM: Function call failed"
      // ...otros campos...
    }
  ]
}
```

A continuación, borra el mapeo duplicado usando el UUID mostrado:

```bash
aws lambda delete-event-source-mapping \
  --uuid c300158a-45f2-48b3-a3da-abd05265c4ae
```

Si prefieres usar el nombre de función, asegúrate de pasar el **nombre generado** por CloudFormation (p. ej. `VideoPipelineCdkStack-NotifyVideoUpdateToAppSyncFDC09763`).

Una vez borrado el mapping, vuelve a desplegar:

```bash
npx cdk deploy
```

### Solución recomendada

```bash
npx cdk deploy
```

### Solución recomendada

1. En tu stack de CDK, cambia el `NodejsFunction` para que genere un bundle CommonJS en lugar de ESM:
   ```ts
   const notifyAppsyncFn = new NodejsFunction(this, 'NotifyVideoUpdateToAppSync', {
     entry: path.join(__dirname, '../lambdas/notify-appsync/index.mjs'),
     runtime: lambda.Runtime.NODEJS_20_X,
     handler: 'handler',
     bundling: {
       format: OutputFormat.CJS,   // <- CommonJS para que require() dinámico funcione
       target: 'es2022',
       minify: false,
       externalModules: ['aws-sdk'],
     },
     environment: {
       APPSYNC_URL: process.env.APPSYNC_URL!,
       AWS_REGION: this.region,
       AWS_ACCOUNT_ID: this.account,
       APPSYNC_API_ID: this.node.tryGetContext('appsyncApiId'),
     },
   });
   ```
2. Redeploy:
   ```bash
   npx cdk deploy
   ```

Con esto la Lambda arrancará sin el error de Smithy, procesará correctamente cada registro de Stream y enviará la notificación a AppSync sin reprocesos infinitos.

---

## Nuevo problema: conflicto al crear EventSourceMapping

Al volver a desplegar el stack, aparece el siguiente error en CloudFormation:

```
CREATE_FAILED AWS::Lambda::EventSourceMapping ... Resource handler returned message: "The event source arn (\"arn:aws:dynamodb:eu-west-2:...:stream/...\") and function (\"...\") provided mapping already exists. Please update or delete the existing mapping with UUID <uuid>"
```

Este mensaje indica que ya existe un mapeo de Streams a Lambda creado previamente, y CDK intenta crearlo de nuevo.

### Solución temporal

Eliminar manualmente el EventSourceMapping existente antes de volver a desplegar:

```bash
# Lista los mappings asociados al ARN de tu Stream de DynamoDB
aws lambda list-event-source-mappings \
  --event-source-arn arn:aws:dynamodb:eu-west-2:471112985974:table/videoDataBucket/stream/2025-04-14T05:58:44.982

# Elimina el mapping usando el UUID obtenido (p. ej. c300158a-45f2-48b3-a3da-abd05265c4ae)
aws lambda delete-event-source-mapping \
  --uuid c300158a-45f2-48b3-a3da-abd05265c4ae
```

> Si `list-event-source-mappings` devuelve un array vacío, significa que el mapping ya ha sido borrado correctamente.

### Solución recomendada

1. **Gestionar el mapping en CDK**: al usar `notifyAppsyncFn.addEventSourceMapping(...)`, CDK debe controlar ese recurso. Para ello, elimina cualquier mapping manual o heredado en la consola de Lambda.
2. **Importar un mapping existente**: si quieres conservar el que ya existe, usa `EventSourceMapping.fromEventSourceMappingId(...)` en tu stack para referenciarlo en vez de crear uno nuevo.

Con estas acciones evitarás conflictos de mapeos duplicados en tus despliegues.

---

## 🔒 Seguridad

- ❌ No se usan credenciales root
- ✅ Usuario IAM (cdk-admin) con AdministratorAccess fue usado solo para test
- ✅ En producción, usa roles separados y permisos mínimos

---

## 🧠 Buenas prácticas

- Usa `.env` para no hardcodear valores como `APPSYNC_URL`
- Documenta bien tu `mutation` en AppSync con `@model`
- Usa `uuid` para generar IDs únicos desde Lambda

---

## ✨ Autores

Alba López Melián 😎 – El 🧠 humano
Deva 🤖 – El 🧠 virtual

---

## 🤝 Contribuciones

¡Bienvenidas! Si quieres mejorar esta arquitectura, enviar una Pull Requests, Issues, ideas locas... ¡todo es bienvenido!