// Learn more: https://docs.expo.dev/guides/customizing-metro/
import { getDefaultConfig } from 'expo/metro-config';

const config = getDefaultConfig(__dirname);

// Bundle SQLite files (assets/data/recipes.db) so require() can load them.
config.resolver.assetExts.push('db');

export default config;
