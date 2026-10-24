import {Config} from '@remotion/cli/config';

// Standard Remotion project config. Rendering is performed by @remotion/renderer
// (Chrome + ffmpeg), never by a hand-written screenshot encoder.
// png keeps the lossless intermediate and avoids yuvj420p (full-range JPEG
// color range) in the H.264 output; switch to 'jpeg' only for speed tests.
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);

// Use the locally installed Chrome instead of downloading Chrome Headless Shell.
// Overridable via --browser-executable on the CLI.
if (!process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  );
}
