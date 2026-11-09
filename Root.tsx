import React from 'react';
import {Composition} from 'remotion';
import {Scene} from './Scene';
import {DURATION_FRAMES, FPS, HEIGHT, WIDTH} from './timeline';

export const Root: React.FC = () => (
  <Composition
    id="JBFlyover"
    component={Scene}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={DURATION_FRAMES}
  />
);
