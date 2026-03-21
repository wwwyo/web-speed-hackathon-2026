import { memo, MouseEventHandler, useCallback } from "react";
import { Link, useNavigate } from "react-router";

import { ProfileImage } from "@web-speed-hackathon-2026/client/src/components/foundation/ProfileImage";
import { ImageArea } from "@web-speed-hackathon-2026/client/src/components/post/ImageArea";
import { MovieArea } from "@web-speed-hackathon-2026/client/src/components/post/MovieArea";
import { SoundArea } from "@web-speed-hackathon-2026/client/src/components/post/SoundArea";
import { TranslatableText } from "@web-speed-hackathon-2026/client/src/components/post/TranslatableText";
import {
  formatDate,
  toISOString,
} from "@web-speed-hackathon-2026/client/src/utils/format_date";

const isClickedAnchorOrButton = (
  target: EventTarget | null,
  currentTarget: Element,
): boolean => {
  while (target !== null && target instanceof Element) {
    const tagName = target.tagName.toLowerCase();
    if (["button", "a"].includes(tagName)) {
      return true;
    }
    if (currentTarget === target) {
      return false;
    }
    target = target.parentNode;
  }
  return false;
};

interface Props {
  postId: string;
  userName: string;
  userUsername: string;
  profileImageId: string;
  profileImageAlt: string;
  createdAt: string;
  text: string;
  images: Models.Image[];
  movieId: string | undefined;
  soundId: string | undefined;
  soundTitle: string | undefined;
  soundArtist: string | undefined;
  soundPeaks: number[] | undefined;
}

const TimelineItemComponent = ({
  postId,
  userName,
  userUsername,
  profileImageId,
  profileImageAlt,
  createdAt,
  text,
  images,
  movieId,
  soundId,
  soundTitle,
  soundArtist,
  soundPeaks,
}: Props) => {
  const navigate = useNavigate();

  const handleClick = useCallback<MouseEventHandler>(
    (ev) => {
      const isSelectedText = document.getSelection()?.isCollapsed === false;
      if (
        !isClickedAnchorOrButton(ev.target, ev.currentTarget) &&
        !isSelectedText
      ) {
        navigate(`/posts/${postId}`);
      }
    },
    [postId, navigate],
  );

  return (
    <article
      className="hover:bg-cax-surface-subtle px-1 sm:px-4"
      onClick={handleClick}
    >
      <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="shrink-0 grow-0 pr-2 sm:pr-4">
          <Link
            className="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16"
            to={`/users/${userUsername}`}
          >
            <ProfileImage
              height={200}
              loading="lazy"
              profileImage={{ id: profileImageId, alt: profileImageAlt }}
              width={200}
            />
          </Link>
        </div>
        <div className="min-w-0 shrink grow">
          <p className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
            <Link
              className="text-cax-text pr-1 font-bold hover:underline"
              to={`/users/${userUsername}`}
            >
              {userName}
            </Link>
            <Link
              className="text-cax-text-muted pr-1 hover:underline"
              to={`/users/${userUsername}`}
            >
              @{userUsername}
            </Link>
            <span className="text-cax-text-muted pr-1">-</span>
            <Link className="text-cax-text-muted pr-1 hover:underline" to={`/posts/${postId}`}>
              <time dateTime={toISOString(createdAt)}>{formatDate(createdAt)}</time>
            </Link>
          </p>
          <div className="text-cax-text leading-relaxed">
            <TranslatableText text={text} />
          </div>
          {images.length > 0 ? (
            <div className="relative mt-2 w-full">
              <ImageArea images={images} />
            </div>
          ) : null}
          {movieId != null ? (
            <div className="relative mt-2 w-full">
              <MovieArea movie={{ id: movieId }} />
            </div>
          ) : null}
          {soundId != null ? (
            <div className="relative mt-2 w-full">
              <SoundArea sound={{ id: soundId, title: soundTitle!, artist: soundArtist!, peaks: soundPeaks! }} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export const TimelineItem = memo(TimelineItemComponent);
TimelineItem.displayName = "TimelineItem";
