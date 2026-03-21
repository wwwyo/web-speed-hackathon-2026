import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  return (
    <section>
      {timeline.map((post) => {
        return (
          <TimelineItem
            key={post.id}
            postId={post.id}
            userName={post.user.name}
            userUsername={post.user.username}
            profileImageId={post.user.profileImage.id}
            profileImageAlt={post.user.profileImage.alt}
            createdAt={post.createdAt}
            text={post.text}
            images={post.images}
            movieId={post.movie?.id}
            soundId={post.sound?.id}
            soundTitle={post.sound?.title}
            soundArtist={post.sound?.artist}
            soundPeaks={post.sound?.peaks}
          />
        );
      })}
    </section>
  );
};
