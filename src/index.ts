import * as core from '@actions/core';
import { parseInput } from './input';
import { getReadmeFile, updateReadmeFile } from './readmeFile';
import { getSectionsFromReadme } from './chart';
import {
  createTrackChart,
  generateNewTrackChartSection,
  createArtistChart,
  generateNewArtistChartSection,
  createAlbumChart,
  generateNewAlbumChartSection,
  createRecentChart,
  generateNewRecentChartSection,
} from './charts';

async function run() {
  const input = await parseInput();
  const readme = await getReadmeFile(input);

  const trackCharts = getSectionsFromReadme('LASTFM_TRACKS', readme.content);
  if (trackCharts) {
    for (const chart of trackCharts) {
      core.info(`Generating chart for ${chart.start}...\n`);
      const trackChart = await createTrackChart(chart, input);
      const newSection = generateNewTrackChartSection(input, chart, trackChart);
      readme.content = readme.content.replace(chart.currentSection, newSection);
    }
  }
  core.setOutput('track-charts', trackCharts ? trackCharts.length : 0);

  const artistCharts = getSectionsFromReadme('LASTFM_ARTISTS', readme.content);
  if (artistCharts) {
    for (const chart of artistCharts) {
      core.info(`Generating chart for ${chart.start}...\n`);
      const artistChart = await createArtistChart(chart, input);
      const newSection = generateNewArtistChartSection(
        input,
        chart,
        artistChart,
      );
      readme.content = readme.content.replace(chart.currentSection, newSection);
    }
  }
  core.setOutput('artist-charts', artistCharts ? artistCharts.length : 0);

  const albumCharts = getSectionsFromReadme('LASTFM_ALBUMS', readme.content);
  if (albumCharts) {
    for (const chart of albumCharts) {
      core.info(`Generating chart for ${chart.start}...\n`);
      const albumChart = await createAlbumChart(chart, input);
      const newSection = generateNewAlbumChartSection(input, chart, albumChart);
      readme.content = readme.content.replace(chart.currentSection, newSection);
    }
  }
  core.setOutput('album-charts', albumCharts ? albumCharts.length : 0);

  const recentCharts = getSectionsFromReadme('LASTFM_RECENT', readme.content);
  if (recentCharts) {
    for (const chart of recentCharts) {
      core.info(`Generating chart for ${chart.start}...\n`);
      const recentChart = await createRecentChart(chart, input);
      const newSection = generateNewRecentChartSection(
        input,
        chart,
        recentChart,
      );
      readme.content = readme.content.replace(chart.currentSection, newSection);
    }
  }
  core.setOutput('recent-charts', recentCharts ? recentCharts.length : 0);

  const unmodifiedReadme = await getReadmeFile(input);
  unmodifiedReadme.content === readme.content
    ? core.info('Chart content is up to date. Skipping update...')
    : await updateReadmeFile(input, readme.hash, readme.content);

  core.setOutput('readme-updated', readme.content !== unmodifiedReadme.content);
  core.setOutput('readme-content', readme.content);
}

run().catch((error) => {
  core.setFailed(error);
  process.exit(1);
});
