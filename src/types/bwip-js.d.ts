declare module 'bwip-js' {
  interface BwipOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    textxalign?: string;
    textsize?: number;
    paddingwidth?: number;
    paddingheight?: number;
    [key: string]: any;
  }

  const bwipjs: {
    toBuffer(opts: BwipOptions): Promise<Buffer> | Buffer;
    toSVG(opts: BwipOptions): string;
    toCanvas(canvas: HTMLCanvasElement | string, opts: BwipOptions): HTMLCanvasElement;
  };

  export default bwipjs;
}
