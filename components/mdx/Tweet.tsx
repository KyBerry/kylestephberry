import { Tweet as ReactTweet } from 'react-tweet'

interface TweetProps {
  id: string
}

export function Tweet({ id }: TweetProps) {
  return (
    <div className="my-6 [&_article]:!mx-auto [&_article]:!max-w-none">
      <ReactTweet id={id} />
    </div>
  )
}
