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

## 🐞 Errores comunes y soluciones

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

- Alba López Melián 😎 – El 🧠 humano
- Deva 🤖 – El 🧠 virtual

---

## 🤝 Contribuciones

¡Bienvenidas! Si quieres mejorar esta arquitectura, enviar una Pull Requests, Issues, ideas locas... ¡todo es bienvenido!
