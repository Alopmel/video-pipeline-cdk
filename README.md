# 🎥 Video Processing Pipeline (AWS CDK)

Este proyecto define una infraestructura en AWS usando **AWS CDK v2** con **TypeScript**. Montamos un pipeline **serverless** para procesar vídeos al estilo ninja: limpio, automático y sin levantar servidores 🥷📦.

---

## 🚀 ¿Qué hace?

- 🧠 Ejecuta una **Step Function** para procesar vídeos
- ⚙️ Invoca **3 funciones Lambda existentes** (por ARN)
- 📤 Reacciona automáticamente al subir `.mp4` o `.mov` a un bucket S3
- 📦 Todo está gestionado con **Infrastructure as Code** (IaC)

---

## ⚙️ Requisitos mínimos

- Node.js >= `18.x` *(hasta abril 2025, luego usa 22)*
- AWS CLI configurado (`aws configure`)
- AWS CDK v2 instalado globalmente (`npm install -g aws-cdk`)
- Cuenta AWS con permisos suficientes
- ARNs de 3 funciones Lambda ya existentes

---

## 🗂️ Estructura del proyecto

. 
├── bin/ 
│ 
└── video-pipeline-cdk.ts # Entry point CDK 
├── lib/ 
│ 
└── video-pipeline-cdk-stack.ts # Stack principal con la infra 
├── test/ 
│ 
└── video-pipeline-cdk.test.ts # (Opcional) Test de stacks 
├── package.json # Dependencias 
├── tsconfig.json # Configuración TS 
├── cdk.json # Config CDK 
└── README.md # Estás aquí 😄

yaml
Copiar
Editar

---

## 📦 Instalación

```bash
git clone https://github.com/TU_USUARIO/video-pipeline-cdk.git
cd video-pipeline-cdk
npm install
aws configure
npm install -g aws-cdk
🔐 cdk bootstrap ¿Para qué sirve?
Antes de desplegar, necesitas preparar tu cuenta AWS:

bash
Copiar
Editar
cdk bootstrap
Esto crea un stack llamado CDKToolkit, que contiene:

Un bucket S3 para almacenar código de Lambdas, assets, etc.

Roles IAM usados por CDK

Parámetros SSM para compatibilidad

✅ Se ejecuta una vez por cuenta/región.

🛠️ Comandos útiles
bash
Copiar
Editar
npm run build          # Transpila TypeScript
cdk diff               # Muestra cambios vs AWS
cdk deploy             # Despliega a la nube ☁️
cdk destroy            # Elimina el stack
🚀 Despliegue
bash
Copiar
Editar
cdk deploy
Al finalizar, obtendrás valores como:

ini
Copiar
Editar
VideoPipelineCdkStack.BucketName = video-upload-bucket-abc
VideoPipelineCdkStack.StepFunctionArn = arn:aws:states:...
📍 También visibles en AWS Console → CloudFormation → Outputs.

🧪 ¿Cómo probarlo?
Entra al bucket S3 creado

Sube un .mp4 o .mov

Se lanzará automáticamente:

EventBridge detecta la subida

Step Function inicia

Ejecuta las 3 Lambdas una tras otra

Monitorea en:

Step Functions → ejecuciones

CloudWatch → logs Lambda

S3 → vídeos subidos y procesados

🧨 Errores típicos
❌ cdk bootstrap falla con bucket existente
Mensaje:

arduino
Copiar
Editar
cdk-hnb659fds-assets-... already exists
✅ Solución:

Borra el bucket conflictivo en S3

Elimina la stack CDKToolkit en CloudFormation

Ejecuta de nuevo cdk bootstrap

❌ SSM parameter /cdk-bootstrap/hnb659fds/version not found
Mensaje:

nginx
Copiar
Editar
Has the environment been bootstrapped?
✅ Solución:

Verifica que ejecutaste cdk bootstrap con el IAM correcto, no el root

Comprueba tu identidad con:

bash
Copiar
Editar
aws sts get-caller-identity
🔒 Seguridad
❌ No se usan credenciales root

✅ Usuario IAM (cdk-admin) con AdministratorAccess fue usado solo para test

✅ En producción, usa roles separados y permisos mínimos

🤝 Contribuciones
Pull Requests, Issues, ideas locas... ¡todo es bienvenido!

✨ Autores
Alba López Melián 😎 – El 🧠 detrás de esta obra maestra

Deva 🤖 – El copiloto de los bits y bytes 🔨🤖🔧

Hecho con 💛 usando AWS CDK y buena onda DevOps