type Props = {
  title: string;
  description: string;
  titleField: string;
  descriptionField: string;
};

export function IndexRuledHeader({
  title,
  description,
  titleField,
  descriptionField,
}: Props) {
  return (
    <header className="index-ruled-header">
      <h1
        className="section-heading index-ruled-title"
        data-customize-field={titleField}
      >
        {title}
      </h1>
      <div className="index-ruled-line" aria-hidden="true" />
      <p
        className="index-ruled-lede"
        data-customize-field={descriptionField}
      >
        {description}
      </p>
    </header>
  );
}
