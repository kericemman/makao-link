const tiffExtensions = new Set([".tif", ".tiff"]);
const heifExtensions = new Set([".heic", ".heif"]);
const rawExtensions = new Set([".dng", ".cr2", ".cr3", ".nef", ".arw", ".rw2"]);
const maxSourceBytes = 25 * 1024 * 1024;
const maxTiffPixels = 32_000_000;
export const MAX_LISTING_UPLOAD_BYTES = 38 * 1024 * 1024;

const getExtension = (name = "") => {
  const index = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index).toLowerCase();
};

const asJpegFile = (blob, file) => {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "property-image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
};

const decodeTiff = async (file) => {
  const { default: UTIF } = await import("utif");
  const buffer = await file.arrayBuffer();
  const directories = UTIF.decode(buffer);
  const image = directories[0];
  if (!image) throw new Error("This TIFF file does not contain a readable image.");

  UTIF.decodeImage(buffer, image);
  if (!image.width || !image.height || image.width * image.height > maxTiffPixels) {
    throw new Error("This TIFF image is too large to process safely.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This TIFF image could not be processed in your browser.");
  const pixels = context.createImageData(image.width, image.height);
  pixels.data.set(UTIF.toRGBA8(image));
  context.putImageData(pixels, 0, 0);
  const jpeg = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  canvas.width = 0;
  canvas.height = 0;
  if (!jpeg) throw new Error("This TIFF image could not be converted to JPEG.");
  return jpeg;
};

const decodeHeif = async (file) => {
  const { default: convertHeif } = await import("heic2any");
  const result = await convertHeif({ blob: file, toType: "image/jpeg", quality: 0.92 });
  const jpeg = Array.isArray(result) ? result[0] : result;
  if (!(jpeg instanceof Blob) || !jpeg.size) throw new Error("This HEIC/HEIF image could not be converted.");
  return jpeg;
};

export const compressListingImage = async (compress, file, options) => {
  const extension = getExtension(file.name);
  const type = String(file.type || "").toLowerCase();

  if (rawExtensions.has(extension)) {
    throw new Error("RAW camera files are not supported. Export this photo as JPEG or PNG first.");
  }
  if (!type.startsWith("image/") && !heifExtensions.has(extension) && !tiffExtensions.has(extension)) {
    throw new Error("Choose a supported image file.");
  }
  if (!file.size || file.size > maxSourceBytes) throw new Error("Choose an image smaller than 25 MB.");

  let source = file;
  if (heifExtensions.has(extension) || type.includes("heic") || type.includes("heif")) source = await decodeHeif(file);
  else if (tiffExtensions.has(extension) || type.includes("tiff")) source = await decodeTiff(file);

  try {
    return asJpegFile(await compress(source, { ...options, fileType: "image/jpeg" }), file);
  } catch {
    throw new Error("This image format could not be decoded. Try exporting it as JPEG or PNG.");
  }
};
