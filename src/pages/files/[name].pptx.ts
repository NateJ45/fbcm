// Safe to edit by hand
// /files/<sha>.pptx: see src/lib/files-route.ts for why each extension has its own route.
import { fileRoute } from '@/lib/files-route';

export const prerender = false;

const handle = fileRoute('pptx');
export const GET = handle;
export const HEAD = handle;
