// import { markdownToBlocks } from "@instantish/mack";
// import type { Post } from "@prisma/client";
// import { marked } from "marked";
// import { env } from "~/env";

// export async function postToSlackIfEnabled({
//   post,
//   authorName,
// }: {
//   post: Post;
//   authorName: string;
// }) {
//   if (env.ENABLE_SLACK_POSTING && env.SLACK_WEBHOOK_URL) {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//     const tokens = marked.lexer(post.content);
//     const summaryToken = tokens.find((token) => {
//       return (
//         token.type === "paragraph" ||
//         token.type === "html" ||
//         token.type === "image"
//       );
//     });
//     const summaryBlocks = summaryToken
//       ? await markdownToBlocks(summaryToken.raw)
//       : [];
//     return fetch(env.SLACK_WEBHOOK_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         blocks: [
//           {
//             type: "section",
//             text: {
//               type: "mrkdwn",
//               text: `*<${env.NEXT_PUBLIC_APP_URL}/forum/post/${post.id}|${post.title}>*`,
//             },
//           },
//           summaryBlocks[0],
//           { type: "divider" },
//           {
//             type: "context",
//             elements: [
//               {
//                 type: "plain_text",
//                 text: authorName,
//                 emoji: true,
//               },
//             ],
//           },
//         ],
//       }),
//     });
//   }
// }
