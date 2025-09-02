import type { ForumComment, Post, Subreddit, User, Vote } from '@prisma/client'

export type ExtendedPost = Post & {
  subreddit: Subreddit
  votes: Vote[]
  author: User
  comments: ForumComment[]
}

export type ExtendedSubreddit = Subreddit & {
  Creator?: User
  _count: {
    posts: number
    subscribers: number
  }
}
