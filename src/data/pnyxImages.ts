export interface PnyxGalleryImage {
  id: string
  src: string
  alt: string
  sourceLabel: string
  sourceUrl: string
}

// PLACEHOLDER DATA — replace before going live.
//
// These images must remain hotlinked to external third-party domains (never
// downloaded into /public). Greek law restricts commercial reproduction of
// photographs of archaeological monuments without permission from the
// Hellenic Ministry of Culture. By hotlinking from the original source and
// keeping a visible, working attribution link to that source's page (not
// just the bare domain), this app is not hosting, reproducing, or claiming
// ownership of the photography — it is pointing visitors to where the real
// photos live.
//
// This is not legal advice. Before launch, confirm each source's terms of
// use / hotlinking policy and the Ministry of Culture's reproduction rules.
export const PNYX_GALLERY_IMAGES: PnyxGalleryImage[] = [
  {
    id: 'placeholder-1',
    src: 'https://PLACEHOLDER.example.com/pnyx-bema.jpg',
    alt: 'PLACEHOLDER — describe the photo (e.g. "The bema, the speaker\'s platform carved into the rock")',
    sourceLabel: 'PLACEHOLDER — e.g. "Photo: Wikimedia Commons / Author Name"',
    sourceUrl: 'https://PLACEHOLDER.example.com/source-page-1',
  },
  {
    id: 'placeholder-2',
    src: 'https://PLACEHOLDER.example.com/pnyx-view.jpg',
    alt: 'PLACEHOLDER — describe the photo (e.g. "View over Athens from the Pnyx assembly area")',
    sourceLabel: 'PLACEHOLDER — e.g. "Photo: Wikimedia Commons / Author Name"',
    sourceUrl: 'https://PLACEHOLDER.example.com/source-page-2',
  },
  {
    id: 'placeholder-3',
    src: 'https://PLACEHOLDER.example.com/pnyx-sunset.jpg',
    alt: 'PLACEHOLDER — describe the photo (e.g. "The Pnyx hill at sunset")',
    sourceLabel: 'PLACEHOLDER — e.g. "Photo: Wikimedia Commons / Author Name"',
    sourceUrl: 'https://PLACEHOLDER.example.com/source-page-3',
  },
]
