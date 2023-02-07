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
  core.debug('Initializing lastfm-readme');

  const input = await parseInput();
  const readme = await getReadmeFile(input);

  const trackCharts = getSectionsFromReadme('LASTFM_TRACKS', readme.content);
  if (trackCharts) {
    core.debug(`Found ${trackCharts.length} track sections\n`);
    for (const chart of trackCharts) {
      core.debug(`Generating ${chart.name} chart for ${chart.start}`);
      const trackChart = await createTrackChart(chart, input);
      const newSection = generateNewTrackChartSection(input, chart, trackChart);
      readme.content = readme.content.replace(chart.currentSection, newSection);
    }
  }
  core.setOutput('track-charts', trackCharts ? trackCharts.length : 0);

  const artistCharts = getSectionsFromReadme('LASTFM_ARTISTS', readme.content);
  if (artistCharts) {
    core.debug(`Found ${artistCharts.length} artist sections\n`);
    for (const chart of artistCharts) {
      core.debug(`Generating ${chart.name} chart for ${chart.start}`);
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
    core.debug(`Found ${albumCharts.length} album sections\n`);
    for (const chart of albumCharts) {
      core.debug(`Generating ${chart.name} chart for ${chart.start}`);
      const albumChart = await createAlbumChart(chart, input);
      const newSection = generateNewAlbumChartSection(input, chart, albumChart);
      readme.content = readme.content.replace(chart.currentSection, newSection);
    }
  }
  core.setOutput('album-charts', albumCharts ? albumCharts.length : 0);

  const recentCharts = getSectionsFromReadme('LASTFM_RECENT', readme.content);
  if (recentCharts) {
    core.debug(`Found ${recentCharts.length} album sections\n`);
    for (const chart of recentCharts) {
      core.debug(`Generating ${chart.name} chart for ${chart.start}`);
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
    ? core.info('🕓 Skipping update, chart content is up to date')
    : await updateReadmeFile(input, readme.hash, readme.content);

  core.setOutput('readme-updated', readme.content !== unmodifiedReadme.content);
  core.setOutput('readme-content', readme.content);
}

run().catch((error) => {
  core.setFailed(error);
  process.exit(1);
});
