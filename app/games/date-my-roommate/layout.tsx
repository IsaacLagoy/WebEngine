import { PlayerProvider } from "./src/player-context";
import { DialoguePlaybackProvider } from "./src/dialogue-playback-context";

export default function DateMyRoommateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PlayerProvider>
      <DialoguePlaybackProvider>{children}</DialoguePlaybackProvider>
    </PlayerProvider>
  );
}
