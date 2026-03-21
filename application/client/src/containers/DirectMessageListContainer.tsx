import { useId } from "react";

import { PageTitle } from "@web-speed-hackathon-2026/client/src/components/application/PageTitle";
import { RouteLoadingPage } from "@web-speed-hackathon-2026/client/src/components/application/RouteLoadingPage";
import { DirectMessageGate } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageGate";
import { DirectMessageListPage } from "@web-speed-hackathon-2026/client/src/components/direct_message/DirectMessageListPage";
import { NewDirectMessageModalContainer } from "@web-speed-hackathon-2026/client/src/containers/NewDirectMessageModalContainer";

interface Props {
  activeUser: Models.User | null;
  authModalId: string;
  isLoadingActiveUser: boolean;
}

export const DirectMessageListContainer = ({
  activeUser,
  authModalId,
  isLoadingActiveUser,
}: Props) => {
  const newDmModalId = useId();

  if (isLoadingActiveUser) {
    return (
      <RouteLoadingPage
        title="ダイレクトメッセージ - CaX"
        headline="ダイレクトメッセージ"
        description="ダイレクトメッセージを表示しています。"
      />
    );
  }

  if (activeUser === null) {
    return (
      <DirectMessageGate
        headline="DMを利用するにはサインインが必要です"
        authModalId={authModalId}
      />
    );
  }

  return (
    <>
      <PageTitle>ダイレクトメッセージ - CaX</PageTitle>
      <DirectMessageListPage activeUser={activeUser} newDmModalId={newDmModalId} />
      <NewDirectMessageModalContainer id={newDmModalId} />
    </>
  );
};
