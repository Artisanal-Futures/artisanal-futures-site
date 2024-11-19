import * as React from 'react'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

import { Button } from '~/app/forum/_components/button'
import { HeartFilledIcon, HeartIcon } from '~/app/forum/_components/icons'
import {
  Tooltip,
  // TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { classNames } from '~/utils/styles'

export const MAX_LIKED_BY_SHOWN = 50

type LikeButtonProps = {
  likedBy: {
    user: {
      id: string
      name: string | null
    }
  }[]
  responsive?: boolean
  onLike: () => void
  onUnlike: () => void
}

export function LikeButton({
  likedBy,
  responsive,
  onLike,
  onUnlike,
}: LikeButtonProps) {
  const [isLikingAnimation, setIsLikingAnimation] = useState(false)

  function handleClick() {
    if (isLikingAnimation) {
      return
    }

    if (isLikedByCurrentUser) {
      onUnlike()
    } else {
      setIsLikingAnimation(!isLikingAnimation)
      onLike()
      setTimeout(() => {
        setIsLikingAnimation(false)
      }, 1000)
    }
  }

  const { data: session } = useSession()

  const isLikedByCurrentUser = Boolean(
    likedBy.find((item) => item.user.id === session!.user.id),
  )
  const likeCount = likedBy.length

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger
          asChild
          onClick={(event) => {
            event.preventDefault()
          }}
          onMouseDown={(event) => {
            event.preventDefault()
          }}
        >
          <Button
            variant="secondary"
            responsive={responsive}
            className={classNames(
              'space-x-1.5 overflow-hidden transition-colors [transform:translateZ(0)]',
              isLikedByCurrentUser &&
                'border-red-300 !bg-red-100 dark:border-red-700 dark:!bg-red-900',
              isLikingAnimation &&
                '!border-red-600 !bg-red-600 dark:!bg-red-600',
            )}
            onClick={handleClick}
          >
            <span className="relative block h-4 w-4 shrink-0">
              {isLikedByCurrentUser && !isLikingAnimation ? (
                <HeartFilledIcon className="scale-1 absolute inset-0 text-forum-red" />
              ) : (
                <>
                  <HeartIcon
                    className={classNames(
                      'absolute inset-0 transform-gpu fill-transparent text-forum-red transition-all',
                      isLikingAnimation && '!scale-[12] !fill-red-600',
                    )}
                  />
                  <span
                    className={classNames(
                      'ring-6 absolute left-[-.5px] top-0 z-10 h-4 w-4 transform-gpu rounded-full ring-inset ring-gray-50 transition-all duration-300',
                      isLikingAnimation ? 'scale-150 !ring-0' : 'scale-0',
                    )}
                  ></span>
                  <HeartFilledIcon
                    className={classNames(
                      'absolute inset-0 z-10 transform-gpu text-gray-50 transition-transform delay-200 duration-300 ease-spring',
                      isLikingAnimation ? 'scale-1' : 'scale-0',
                    )}
                  />
                </>
              )}
            </span>

            <span
              className={classNames(
                'relative z-10 tabular-nums',
                isLikingAnimation &&
                  'text-gray-50 transition-colors duration-100',
              )}
            >
              {likeCount}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={4}
          className={classNames(
            'max-w-[260px] rounded bg-forum-secondary-inverse px-3 py-1.5 text-forum-secondary-inverse shadow-lg sm:max-w-sm',
            likeCount === 0 && 'hidden',
          )}
        >
          <p className="text-sm">
            {likedBy
              .slice(0, MAX_LIKED_BY_SHOWN)
              .map((item) =>
                item.user.id === session!.user.id ? 'You' : item.user.name,
              )
              .join(', ')}
            {likeCount > MAX_LIKED_BY_SHOWN &&
              ` and ${likeCount - MAX_LIKED_BY_SHOWN} more`}
          </p>
          {/* <Tooltip.Arrow
            offset={22}
            className="fill-gray-800 dark:fill-gray-50"
          /> */}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
