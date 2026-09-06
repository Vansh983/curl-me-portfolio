// n8ao ships no types. Only what the stage uses.
declare module 'n8ao' {
  import type { Camera, Color, Scene, WebGLRenderer, WebGLRenderTarget } from 'three';
  import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
  export interface N8AOConfiguration {
    aoSamples: number; aoRadius: number; denoiseSamples: number; denoiseRadius: number; distanceFalloff: number; intensity: number;
    denoiseIterations: number; renderMode: 0 | 1 | 2 | 3 | 4; color: Color; gammaCorrection: boolean; screenSpaceRadius: boolean;
    halfRes: boolean; depthAwareUpsampling: boolean; colorMultiply: boolean; transparencyAware: boolean; accumulate: boolean; neuralDenoise: boolean;
  }
  export class N8AOPass extends Pass {
    constructor(scene: Scene, camera: Camera, width?: number, height?: number);
    configuration: N8AOConfiguration;
    autosetGamma: boolean;
    setQualityMode(mode: 'Performance' | 'Low' | 'Medium' | 'High' | 'Ultra'): void;
    setSize(width: number, height: number): void;
    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget): void;
    dispose(): void;
  }
}
