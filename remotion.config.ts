import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setChromiumOpenGlRenderer('angle'); // WebGL2 in headless Chrome
Config.setOverwriteOutput(true);
