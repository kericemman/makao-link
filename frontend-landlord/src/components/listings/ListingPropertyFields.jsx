import ListingBasicFields from "./ListingBasicFields";
import ListingLocationFields from "./ListingLocationFields";
import CountySearchSelect from "./CountySearchSelect";
import { FiCheckCircle, FiDollarSign, FiGrid, FiHome, FiMapPin, FiTarget, FiVideo } from "react-icons/fi";
import { FaBath, FaBed, FaBuilding, FaPhone, FaRuler, FaRulerCombined, FaUtensils } from "react-icons/fa";

const fieldClass = (hasError = false) => `w-full rounded-lg border-2 bg-white px-4 py-3 outline-none ${hasError ? "border-red-400 bg-red-50" : "border-[#E2E8F0] focus:border-[#126542]"}`;

function Field({ label, name, error, children }) {
  return <div><label htmlFor={name} className="mb-1 block text-sm font-medium text-[#0F172A]">{label}</label>{children}{error && <p className="mt-1 text-sm text-red-500">{error}</p>}</div>;
}

export default function ListingPropertyFields({
  formData, errors, onChange, onAmenityChange, disabled, loading, metaLoading,
  purposes, propertyTypes, residentialTypes, isResidential, isOffice,
  countyOptions, townOptions, listingMeta, amenitiesList,
  onUseCurrentLocation, mapSrc, mapLatitude, mapLongitude
}) {
  return <>
    <ListingBasicFields formData={formData} errors={errors} onChange={onChange} disabled={disabled} />

    <section className="rounded-md border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-[#0F172A]"><FiMapPin className="mr-2 text-[#126542]" />Location & Price</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field name="purpose" label={<>Purpose <span className="text-red-500">*</span></>} error={errors.purpose}>
          <div className="relative"><FiTarget className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><select id="purpose" name="purpose" value={formData.purpose} onChange={onChange} disabled={disabled} className={`${fieldClass(Boolean(errors.purpose))} pl-10 appearance-none`}>{purposes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        </Field>
        <Field name="price" label={<>{formData.purpose === "short_stay" ? "Price per night (KES)" : "Price (KES)"} <span className="text-red-500">*</span></>} error={errors.price}>
          <div className="relative"><FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><input id="price" name="price" type="number" min="0" value={formData.price} onChange={onChange} placeholder={formData.purpose === "short_stay" ? "e.g., 8500 per night" : "e.g., 25000"} disabled={disabled} className={`${fieldClass(Boolean(errors.price))} pl-10`} /></div>
        </Field>
        {formData.purpose === "short_stay" && <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#F3F8F5] p-4 md:col-span-2">
          <Field name="maxGuests" label="Maximum guests" error={errors.maxGuests}><input id="maxGuests" name="maxGuests" type="number" min="1" value={formData.maxGuests} onChange={onChange} disabled={disabled} className={fieldClass(Boolean(errors.maxGuests))} /></Field>
          <Field name="minNights" label="Minimum nights" error={errors.minNights}><input id="minNights" name="minNights" type="number" min="1" value={formData.minNights} onChange={onChange} disabled={disabled} className={fieldClass(Boolean(errors.minNights))} /></Field>
          <Field name="checkInTime" label="Check-in from"><input id="checkInTime" name="checkInTime" type="time" value={formData.checkInTime} onChange={onChange} disabled={disabled} className={fieldClass()} /></Field>
          <Field name="checkOutTime" label="Check-out by"><input id="checkOutTime" name="checkOutTime" type="time" value={formData.checkOutTime} onChange={onChange} disabled={disabled} className={fieldClass()} /></Field>
        </div>}
        <Field name="county" label={<>County <span className="text-red-500">*</span></>} error={errors.county}>
          <CountySearchSelect value={formData.county} options={countyOptions} onChange={onChange} disabled={disabled} invalid={Boolean(errors.county)} />
        </Field>
        <Field name="town" label={<>Town / Location <span className="text-red-500">*</span></>} error={errors.town}>
          <div className="relative"><FiHome className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><select id="town" name="town" value={formData.town} onChange={onChange} disabled={!formData.county || disabled} className={`${fieldClass(Boolean(errors.town))} appearance-none pl-10`}><option value="">Select Town</option>{townOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        </Field>
        <ListingLocationFields formData={formData} onChange={onChange} onUseCurrentLocation={onUseCurrentLocation} loading={loading} metaLoading={metaLoading} mapSrc={mapSrc} mapLatitude={mapLatitude} mapLongitude={mapLongitude} />
      </div>
    </section>

    <section className="rounded-md border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-[#0F172A]"><FiGrid className="mr-2 text-[#126542]" />Property Details</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field name="type" label={<>Property Type <span className="text-red-500">*</span></>} error={errors.type}>
          <div className="relative"><FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><select id="type" name="type" value={formData.type} onChange={onChange} disabled={disabled} className={`${fieldClass(Boolean(errors.type))} appearance-none pl-10`}><option value="">Select Type</option>{propertyTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
        </Field>
        {isResidential && <>
          <Field name="bedrooms" label={<>Bedrooms <span className="text-red-500">*</span></>} error={errors.bedrooms}><div className="relative"><FaBed className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><input id="bedrooms" name="bedrooms" type="number" min="0" value={formData.bedrooms} onChange={onChange} placeholder="e.g., 2" disabled={disabled} className={`${fieldClass(Boolean(errors.bedrooms))} pl-10`} /></div></Field>
          <Field name="bathrooms" label={<>Bathrooms <span className="text-red-500">*</span></>} error={errors.bathrooms}><div className="relative"><FaBath className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><input id="bathrooms" name="bathrooms" type="number" min="0" value={formData.bathrooms} onChange={onChange} placeholder="e.g., 2" disabled={disabled} className={`${fieldClass(Boolean(errors.bathrooms))} pl-10`} /></div></Field>
        </>}
        {isOffice && <>
          <Field name="size" label={<>Size <span className="text-red-500">*</span></>} error={errors.size}><div className="relative"><FaRuler className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><input id="size" name="size" type="number" min="0" value={formData.size} onChange={onChange} placeholder="e.g., 1200" disabled={disabled} className={`${fieldClass(Boolean(errors.size))} pl-10`} /></div></Field>
          <Field name="sizeUnit" label="Size Unit"><div className="relative"><FaRulerCombined className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><select id="sizeUnit" name="sizeUnit" value={formData.sizeUnit} onChange={onChange} disabled={disabled} className={`${fieldClass()} appearance-none pl-10`}>{(listingMeta.officeSizeUnits || []).map((unit) => <option key={unit} value={unit}>{unit === "sqft" ? "Square Feet (sq ft)" : unit}</option>)}</select></div></Field>
        </>}
        <Field name="contactPhone" label={<>Contact Phone <span className="text-red-500">*</span></>} error={errors.contactPhone}><div className="relative"><FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><input id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={onChange} placeholder="e.g., 0712345678" disabled={disabled} className={`${fieldClass(Boolean(errors.contactPhone))} pl-10`} /></div></Field>
        <label className="flex cursor-pointer items-center gap-3 md:col-span-2"><input type="checkbox" name="kitchen" checked={formData.kitchen} onChange={onChange} className="h-5 w-5 accent-[#126542]" /><span className="flex items-center text-sm text-[#475569]"><FaUtensils className="mr-2" />Kitchen available</span></label>
      </div>
    </section>

    <section className="rounded-md border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-[#0F172A]"><FiVideo className="mr-2 text-[#126542]" />Virtual Tour (Optional)</h2>
      <Field name="video" label="Video URL"><div className="relative"><FiVideo className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" /><input id="video" name="video" value={formData.video} onChange={onChange} placeholder="https://youtube.com/watch?v=..." disabled={disabled} className={`${fieldClass()} pl-10`} /></div><p className="mt-1 text-xs text-[#475569]">Add a YouTube or Vimeo link for a virtual tour of your property</p></Field>
    </section>

    <section className="rounded-md border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-[#0F172A]"><FiCheckCircle className="mr-2 text-[#126542]" />Amenities</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">{amenitiesList.map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={Boolean(formData.amenities[item.key])} onChange={() => onAmenityChange(item.key)} disabled={disabled} className="h-5 w-5 accent-[#126542]" /><span className="text-sm text-[#475569]">{item.label}</span></label>)}</div>
    </section>
  </>;
}
