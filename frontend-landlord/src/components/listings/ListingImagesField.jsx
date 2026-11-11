import { FiCamera, FiTrash2, FiUpload } from "react-icons/fi";

export default function ListingImagesField({ imagesCount, imageLimit, previews, error, disabled, processing, onFilesChange, onRemove }) {
  return <section className="rounded-md border border-[#E2E8F0] bg-white p-6 shadow-sm">
    <h2 className="mb-4 flex items-center text-lg font-semibold text-[#0F172A]"><FiCamera className="mr-2 text-[#126542]" />Property Images <span className="ml-1 text-red-500">*</span></h2>
    <div className="mb-4">
      <div className={`rounded-md border-2 border-dashed p-6 text-center transition-all ${error ? "border-red-300 bg-red-50" : "border-[#E2E8F0] hover:border-[#126542]"}`}>
        <input type="file" multiple accept="image/*,.heic,.heif,.tif,.tiff" onChange={onFilesChange} className="hidden" id="image-upload" disabled={disabled} />
        <label htmlFor="image-upload" className={`flex flex-col items-center ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
          <FiUpload className="mb-2 text-3xl text-[#475569]" /><span className="text-sm text-[#475569]">Click to upload or drag and drop</span>
          <span className="mt-1 text-xs text-[#475569]">{processing ? "Preparing images..." : `Select multiple images. Large files are compressed before upload. Max ${imageLimit} images and 38 MB per upload.`}</span>
        </label>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      <p className="mt-2 text-xs text-[#475569]">{imagesCount}/{imageLimit} image(s) selected</p>
    </div>
    {previews.length > 0 && <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{previews.map((src, index) => <div key={`${src}-${index}`} className="group relative">
      <img src={src} alt={`Preview ${index + 1}`} className="h-24 w-full rounded-lg border border-[#E2E8F0] object-cover" />
      <button type="button" onClick={() => onRemove(index)} aria-label={`Remove image ${index + 1}`} disabled={disabled} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-100 transition-opacity hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"><FiTrash2 size={12} /></button>
    </div>)}</div>}
  </section>;
}
