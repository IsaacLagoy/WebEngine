import { PlayerProvider } from "./src/player-context";

export default function DateMyRoommateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PlayerProvider>{children}</PlayerProvider>;
}
