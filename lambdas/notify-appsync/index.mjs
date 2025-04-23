// import { v4 as uuidv4 } from "uuid";

// const APPSYNC_URL     = process.env.APPSYNC_URL;
// const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY;

// const mutation = `
//   mutation Notify($input: CreateVideoNotificationInput!) {
//     createVideoNotification(input: $input) {
//       id
//     }
//   }
// `;

// export const handler = async (event) => {
//   console.log("🔑 Env vars:", {
//     APPSYNC_URL,
//     APPSYNC_API_KEY: !!APPSYNC_API_KEY,
//   });

//   for (const record of event.Records) {
//     const image     = record.dynamodb?.NewImage;
//     const oldImage  = record.dynamodb?.OldImage;
//     const eventName = record.eventName;

//     const baseInput = {
//       id:        uuidv4(),
//       videoId:   (image || oldImage)?.videoId?.S || "",
//       title:     (image || oldImage)?.title?.S || "",
//       category:  (image || oldImage)?.category?.S || "",
//       updatedAt: new Date().toISOString(),
//       etag:      (image || oldImage)?.eTag?.S || "",
//     };

//     const actionMap = {
//       INSERT: "CREATE",
//       MODIFY: "UPDATE",
//       REMOVE: "DELETE"
//     };

//     const input = {
//       ...baseInput,
//       action: actionMap[eventName] || "UNKNOWN",
//     };

//     try {
//       const res = await fetch(APPSYNC_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "x-api-key":    APPSYNC_API_KEY,
//         },
//         body: JSON.stringify({
//           query: mutation,
//           variables: { input },
//         }),
//       });

//       const json = await res.json();
//       console.log("✅ AppSync responded:", json);
//     } catch (err) {
//       console.error("❌ Falló la llamada a AppSync:", err);
//     }
//   }
// };
// video-pipeline-cdk/lambdas/notify-appsync/index.mjs

import { v4 as uuidv4 } from "uuid";

// AppSync en modo API_KEY
const APPSYNC_URL     = process.env.APPSYNC_URL;
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY;

// —————— 1️⃣ Mutación para crear el registro en la tabla Video
const createVideoMutation = /* GraphQL */ `
  mutation CreateVideo($input: CreateVideoInput!) {
    createVideo(input: $input) {
      id
    }
  }
`;

// —————— 2️⃣ Mutación para crear la notificación en VideoNotification
const createNotificationMutation = /* GraphQL */ `
  mutation Notify($input: CreateVideoNotificationInput!) {
    createVideoNotification(input: $input) {
      id
    }
  }
`;

export const handler = async (event) => {
  console.log("🔑 Env vars:", { APPSYNC_URL, APPSYNC_API_KEY: !!APPSYNC_API_KEY });

  for (const record of event.Records) {
    const image     = record.dynamodb?.NewImage;
    const oldImage  = record.dynamodb?.OldImage;
    const eventName = record.eventName; // "INSERT" | "MODIFY" | "REMOVE"

    // Extraemos todos los campos desde DynamoDB Stream (creados por videoDataBucketCRUD)
    const id          = (image || oldImage)?.id?.S           || uuidv4();
    const videoId     = (image || oldImage)?.videoId?.S      || "";
    const title       = (image || oldImage)?.title?.S        || "";
    const category    = (image || oldImage)?.category?.S     || "Unknown";
    const description = (image || oldImage)?.description?.S  || "";
    const totalViews  = parseInt((image || oldImage)?.totalViews?.N || "0", 10);
    const createdAt   = (image || oldImage)?.createdAt?.S    || new Date().toISOString();
    const lastModified= (image || oldImage)?.lastModified?.S || new Date().toISOString();
    const eTag        = (image || oldImage)?.eTag?.S         || "";
    const updatedAt   = new Date().toISOString();

    // 1️⃣ Preparamos el input para createVideo
    const videoInput = {
      id,
      videoId,
      title,
      description,
      category,
      totalViews,
      createdAt,
      lastModified,
      key: videoId,      // asumimos que 'key' es el mismo videoId en S3
      etag: eTag,
      updatedAt,
    };

    // 2️⃣ Preparamos el input para createVideoNotification
    const actionMap = { INSERT: "CREATE", MODIFY: "UPDATE", REMOVE: "DELETE" };
    const notificationInput = {
      id:        uuidv4(),
      videoId,
      action:    actionMap[eventName] || "UNKNOWN",
      title,
      category,
      etag:      eTag,
      updatedAt,
      createdAt,  // cuando se crea la notificación
    };

    try {
      // —————— Crear el Video ——————
      const respVideo = await fetch(APPSYNC_URL, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":    APPSYNC_API_KEY,
        },
        body: JSON.stringify({
          query:     createVideoMutation,
          variables: { input: videoInput },
        }),
      });
      const jsonVideo = await respVideo.json();
      console.log("✅ createVideo:", JSON.stringify(jsonVideo));

      // —————— Crear la VideoNotification ——————
      // Comentamos el caso UPDATE por ahora
      if (notificationInput.action !== "UPDATE") {
        const respNotif = await fetch(APPSYNC_URL, {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key":    APPSYNC_API_KEY,
          },
          body: JSON.stringify({
            query:     createNotificationMutation,
            variables: { input: notificationInput },
          }),
        });
        const jsonNotif = await respNotif.json();
        console.log("✅ createVideoNotification:", JSON.stringify(jsonNotif));
      } else {
        console.log(`⏭️ Skip notification for UPDATE (videoId=${videoId})`);
      }

    } catch (err) {
      console.error("❌ Falló llamada a AppSync:", err);
    }
  }
};
