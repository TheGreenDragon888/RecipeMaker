// PRESENTATION LAYER: loads the mockup's fonts and holds the app back until they are ready.
// If loading fails, the app still opens and text falls back to the system font.
import React from 'react';
import { useFonts } from 'expo-font';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat/600SemiBold';
import { Lora_600SemiBold } from '@expo-google-fonts/lora/600SemiBold';
import { NunitoSans_400Regular } from '@expo-google-fonts/nunito-sans/400Regular';
import { NunitoSans_600SemiBold } from '@expo-google-fonts/nunito-sans/600SemiBold';
import { NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans/700Bold';
import { NunitoSans_800ExtraBold } from '@expo-google-fonts/nunito-sans/800ExtraBold';

// The keys become the family names that theme.fonts refers to.
const fontFiles = {
  Lora_600SemiBold,
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
  Caveat_600SemiBold,
};

type Props = {
  children: React.ReactNode;
};

export function AppFontsGate({ children }: Props) {
  const [loaded, error] = useFonts(fontFiles);
  if (!loaded && !error) return null;
  return <>{children}</>;
}
