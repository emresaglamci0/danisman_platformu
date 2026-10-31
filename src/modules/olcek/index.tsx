import { olcekModuluAktif } from "./ayar";
import { OlcekPenceresi } from "./OlcekPenceresi";

// Sitenin olcek modulune actigi TEK kapi. Modul kapaliysa hicbir sey gostermez.
export function OlcekAlani() {
  if (!olcekModuluAktif()) return null;
  return <OlcekPenceresi />;
}
