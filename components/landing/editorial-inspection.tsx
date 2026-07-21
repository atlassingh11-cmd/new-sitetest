import Image from "next/image";

export function EditorialInspection() {
  return (
    <section
      aria-label="Property inspection before handover"
      className="editorial-inspection"
      data-inspection-sticky=""
    >
      <div className="editorial-inspection__media">
        <Image
          alt="Keys, a floor plan, notebook and laser measure laid out for a property inspection"
          className="editorial-inspection__image"
          fill
          loading="lazy"
          sizes="100vw"
          src="/media/inspection-editorial.webp"
        />
      </div>
    </section>
  );
}
