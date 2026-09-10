import bwipjs from 'bwip-js';

export async function barcodePngDataUrl(text: string): Promise<string> {
  const buf = await bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: 'center',
    textsize: 12,
    paddingwidth: 8,
    paddingheight: 6
  });
  return `data:image/png;base64,${buf.toString('base64')}`;
}
