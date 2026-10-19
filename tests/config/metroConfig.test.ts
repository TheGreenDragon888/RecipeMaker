/**
 * @jest-environment node
 */
// Loads the Metro config the same way Expo CLI does, so a config file Expo cannot read fails here too.
// Runs in Node, not the React Native test environment: the loader is Node tooling, like Expo CLI.
import path from 'path';
import { loadUserConfig } from '@expo/metro-config';

const projectRoot = path.resolve(__dirname, '../..');

describe('metro config', () => {
  it('can be read by Expo CLI from metro.config.ts', async () => {
    const overrideConfigPath = path.join(projectRoot, 'metro.config.ts');
    await expect(loadUserConfig({ projectRoot, serverRoot: projectRoot, overrideConfigPath })).resolves.toBeDefined();
  });

  it('bundles .db files, so require() can load recipes.db', async () => {
    const config = await loadUserConfig({ projectRoot, serverRoot: projectRoot });
    expect(config.resolver.assetExts).toContain('db');
  });
});
