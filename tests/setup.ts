import { vi } from 'vitest';

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'test-owner', repo: 'test-repo' },
  },
  getOctokit: vi.fn(),
}));

// Mock lastfm-typed
vi.mock('lastfm-typed', () => {
  const LastFMTyped = vi.fn().mockImplementation(() => ({
    auth: {
      getToken: vi.fn().mockResolvedValue({ token: 'mocked-token' }),
    },
    user: {
      getRecentTracks: vi.fn(),
      getTopArtists: vi.fn(),
      getTopTracks: vi.fn(),
      getTopAlbums: vi.fn(),
      getInfo: vi.fn(),
    },
  }));

  return { default: LastFMTyped };
});
