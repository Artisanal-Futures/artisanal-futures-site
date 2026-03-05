/**
 * Fork import: allowed table keys from export JSON and which are auth tables.
 * JSON keys are PascalCase (e.g. VerificationToken). Prisma delegates are camelCase (e.g. verification).
 */

export const AUTH_TABLE_KEYS = new Set([
  "User",
  "Account",
  "Session",
  "VerificationToken",
] as const);

export type AuthTableKey = (typeof AUTH_TABLE_KEYS extends Set<infer K> ? K : never)[number];

/** JSON key -> Prisma delegate name (first letter lowercased). VerificationToken -> verification. */
export const TABLE_KEY_TO_DELEGATE: Record<string, string> = {
  User: "user",
  Account: "account",
  Session: "session",
  VerificationToken: "verification",
  Example: "example",
  Survey: "survey",
  GuestSurvey: "guestSurvey",
  UpcycleResult: "upcycleResult",
  UpcycleQuestion: "upcycleQuestion",
  Notification: "notification",
  UpcycleRating: "upcycleRating",
  Category: "category",
  Service: "service",
  WebsiteProvision: "websiteProvision",
  Shop: "shop",
  ShopAddress: "shopAddress",
  Product: "product",
  Subreddit: "subreddit",
  Subscription: "subscription",
  Post: "post",
  ForumComment: "forumComment",
  Vote: "vote",
  CommentVote: "commentVote",
  TrainingModel: "trainingModel",
  TrainingImage: "trainingImage",
  TrainingJob: "trainingJob",
  TrainingDataSet: "trainingDataSet",
  GenerationJob: "generationJob",
  GeneratedImages: "generatedImages",
  GenerationSurvey: "generationSurvey",
  Variation: "variation",
  Modification: "modification",
  Depot: "depot",
  Address: "address",
  Schedule: "schedule",
  Driver: "driver",
  Vehicle: "vehicle",
  Break: "break",
  Client: "client",
  Job: "job",
  Route: "route",
  OptimizedRoutePath: "optimizedRoutePath",
  OptimizedStop: "optimizedStop",
  Member: "member",
  Message: "message",
  Conversation: "conversation",
  Profile: "profile",
  Server: "server",
  Channel: "channel",
  DirectMessage: "directMessage",
};

/** Table keys we support for import (must exist in TABLE_KEY_TO_DELEGATE and in Prisma). */
export const IMPORTABLE_TABLE_KEYS = Object.keys(TABLE_KEY_TO_DELEGATE);

export function isAuthTable(tableKey: string): boolean {
  return (AUTH_TABLE_KEYS as Set<string>).has(tableKey);
}

export function getDelegateName(tableKey: string): string | undefined {
  return TABLE_KEY_TO_DELEGATE[tableKey];
}
