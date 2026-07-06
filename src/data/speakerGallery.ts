/**
 * Speaker gallery data
 * --------------------
 * Photos for the /speakers Pinterest-style gallery page.
 *
 * To add a photo:
 *   1. Drop the image into the public/ folder (e.g. public/speaker-1.jpg).
 *      The OptimizedImage component will auto-generate a WebP <source> by
 *      swapping the extension, so a .jpg / .png here gives you both formats.
 *   2. Append an entry to `speakerGallery` below — that's it.
 *
 * Each entry needs:
 *   - src:       path under public/ (e.g. "/speaker-1.jpg")
 *   - alt:       short accessible description of what's in the photo
 *   - width:     intrinsic image width in px (used to reserve layout space
 *                so the masonry doesn't jump as images stream in)
 *   - height:    intrinsic image height in px
 *   - caption?:  optional short caption shown on hover
 *   - tag?:      one of "desk" | "wall" | "studio" | "lifestyle" — used
 *                by the filter pills at the top of the page
 *
 * Example entry:
 *   { src: "/speaker-1.jpg", alt: "Vintage Sheesham on a side table",
 *     width: 1080, height: 1350, tag: "studio",
 *     caption: "Heritage Sheesham — Studio" },
 */

export type SpeakerTag = "desk" | "wall" | "studio" | "lifestyle";

export interface SpeakerPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  tag?: SpeakerTag;
}

export const speakerGallery: SpeakerPhoto[] = [
  {
    src: "/Speaker__1.jpg",
    alt: "Massive wooden speaker, front three-quarter view",
    width: 1600,
    height: 1067,
    tag: "studio",
  },
  {
    src: "/Speaker__2.jpg",
    alt: "Massive wooden speaker, alternate angle",
    width: 1600,
    height: 1067,
    tag: "studio",
  },
  {
    src: "/Speaker__3.jpg",
    alt: "Massive wooden speaker, low-angle view",
    width: 1600,
    height: 1067,
    tag: "studio",
  },
  {
    src: "/Speaker__4.jpg",
    alt: "Massive wooden speaker on a styled surface",
    width: 1600,
    height: 962,
    tag: "studio",
  },
  {
    src: "/Speaker__5.jpg",
    alt: "Massive wooden speaker, panoramic studio shot",
    width: 1600,
    height: 870,
    tag: "studio",
  },
  {
    src: "/Speaker__6.jpg",
    alt: "Massive wooden speaker, detail composition",
    width: 1600,
    height: 987,
    tag: "studio",
  },
  {
    src: "/Speaker__7.jpg",
    alt: "Massive wooden speaker, tall composition",
    width: 1600,
    height: 1272,
    tag: "studio",
  },
  {
    src: "/Speaker__8.jpg",
    alt: "Massive wooden speaker, alternate detail",
    width: 1600,
    height: 1048,
    tag: "studio",
  },
];
