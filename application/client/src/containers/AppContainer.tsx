import { lazy, Suspense, useCallback, useEffect, useId, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AppPage } from "@web-speed-hackathon-2026/client/src/components/application/AppPage";
import { RouteLoadingPage } from "@web-speed-hackathon-2026/client/src/components/application/RouteLoadingPage";
import { AuthModalContainer } from "@web-speed-hackathon-2026/client/src/containers/AuthModalContainer";
import { NewPostModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewPostModalContainer";
import { SearchContainer } from "@web-speed-hackathon-2026/client/src/containers/SearchContainer";
import { fetchJSON, sendJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const CrokContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/CrokContainer").then((m) => ({
    default: m.CrokContainer,
  })),
);
const DirectMessageContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageContainer").then((m) => ({
    default: m.DirectMessageContainer,
  })),
);
const DirectMessageListContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/DirectMessageListContainer").then(
    (m) => ({
      default: m.DirectMessageListContainer,
    }),
  ),
);
const NotFoundContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/NotFoundContainer").then((m) => ({
    default: m.NotFoundContainer,
  })),
);
const PostContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/PostContainer").then((m) => ({
    default: m.PostContainer,
  })),
);
const TermContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TermContainer").then((m) => ({
    default: m.TermContainer,
  })),
);
const TimelineContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/TimelineContainer").then((m) => ({
    default: m.TimelineContainer,
  })),
);
const UserProfileContainer = lazy(() =>
  import("@web-speed-hackathon-2026/client/src/containers/UserProfileContainer").then((m) => ({
    default: m.UserProfileContainer,
  })),
);

const getRouteLoadingState = (pathname: string) => {
  if (pathname === "/") {
    return {
      title: "タイムライン - CaX",
      headline: "タイムライン",
      description: "タイムラインを表示しています。",
    };
  }

  if (pathname === "/dm" || pathname.startsWith("/dm/")) {
    return {
      title: "ダイレクトメッセージ - CaX",
      headline: "ダイレクトメッセージ",
      description: "ダイレクトメッセージを表示しています。",
    };
  }

  if (pathname.startsWith("/users/")) {
    return {
      title: "読込中 - CaX",
      headline: "ユーザーページ",
      description: "プロフィールを表示しています。",
    };
  }

  if (pathname.startsWith("/posts/")) {
    return {
      title: "読込中 - CaX",
      headline: "投稿詳細",
      description: "投稿の内容を表示しています。",
    };
  }

  if (pathname === "/terms") {
    return {
      title: "利用規約 - CaX",
      headline: "利用規約",
      description: "利用規約を表示しています。",
    };
  }

  if (pathname === "/crok") {
    return {
      title: "Crok - CaX",
      headline: "Crok",
      description: "Crok を表示しています。",
    };
  }

  return {
    title: "読込中 - CaX",
    headline: "読込中",
    description: "ページを表示しています。",
  };
};

export const AppContainer = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const [activeUser, setActiveUser] = useState<Models.User | null>(null);
  const [isLoadingActiveUser, setIsLoadingActiveUser] = useState(true);
  useEffect(() => {
    void fetchJSON<Models.User>("/api/v1/me")
      .then((user) => {
        setActiveUser(user);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoadingActiveUser(false);
      });
  }, [setActiveUser, setIsLoadingActiveUser]);
  const handleLogout = useCallback(async () => {
    await sendJSON("/api/v1/signout", {});
    setActiveUser(null);
    navigate("/");
  }, [navigate]);

  const authModalId = useId();
  const newPostModalId = useId();
  const routeLoadingState = getRouteLoadingState(pathname);
  const routeFallback = <RouteLoadingPage {...routeLoadingState} />;

  return (
    <>
      <AppPage
        activeUser={activeUser}
        authModalId={authModalId}
        isLoadingActiveUser={isLoadingActiveUser}
        newPostModalId={newPostModalId}
        onLogout={handleLogout}
      >
        <Routes>
          <Route
            element={
              <Suspense fallback={routeFallback}>
                <TimelineContainer />
              </Suspense>
            }
            path="/"
          />
          <Route
            element={
              <Suspense fallback={routeFallback}>
                <DirectMessageListContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  isLoadingActiveUser={isLoadingActiveUser}
                />
              </Suspense>
            }
            path="/dm"
          />
          <Route
            element={
              <Suspense fallback={routeFallback}>
                <DirectMessageContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  isLoadingActiveUser={isLoadingActiveUser}
                />
              </Suspense>
            }
            path="/dm/:conversationId"
          />
          <Route element={<SearchContainer />} path="/search" />
          <Route
            element={
              <Suspense fallback={routeFallback}>
                <UserProfileContainer />
              </Suspense>
            }
            path="/users/:username"
          />
          <Route
            element={
              <Suspense fallback={routeFallback}>
                <PostContainer />
              </Suspense>
            }
            path="/posts/:postId"
          />
          <Route
            element={
              <Suspense fallback={routeFallback}>
                <TermContainer />
              </Suspense>
            }
            path="/terms"
          />
          <Route
            element={
              <Suspense fallback={routeFallback}>
                <CrokContainer
                  activeUser={activeUser}
                  authModalId={authModalId}
                  isLoadingActiveUser={isLoadingActiveUser}
                />
              </Suspense>
            }
            path="/crok"
          />
          <Route
            element={
              <Suspense fallback={routeFallback}>
                <NotFoundContainer />
              </Suspense>
            }
            path="*"
          />
        </Routes>
      </AppPage>

      <AuthModalContainer id={authModalId} onUpdateActiveUser={setActiveUser} />
      <NewPostModalContainer id={newPostModalId} />
    </>
  );
};
