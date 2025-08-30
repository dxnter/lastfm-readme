import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const lastFmHandlers = [
  http.get('https://ws.audioscrobbler.com/2.0/', ({ request }) => {
    const url = new URL(request.url);
    const method = url.searchParams.get('method');

    if (method === 'user.getrecenttracks') {
      return HttpResponse.json({
        recenttracks: {
          track: [
            {
              name: 'Test Track',
              artist: {
                '#text': 'Test Artist',
                url: 'https://last.fm/artist/test',
              },
              url: 'https://last.fm/track/test',
              date: { uts: '1640995200' },
            },
          ],
        },
      });
    }

    if (method === 'user.gettopartists') {
      return HttpResponse.json({
        topartists: {
          artist: [
            {
              name: 'Test Artist',
              url: 'https://last.fm/artist/test',
              playcount: '100',
            },
          ],
        },
      });
    }

    return HttpResponse.json({ error: 'Unknown method' });
  }),
];

export const server = setupServer(...lastFmHandlers);
