import { GameProvider } from "./src/game-context";

export default function DateMyRoommateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <GameProvider>{children}</GameProvider>;
}
