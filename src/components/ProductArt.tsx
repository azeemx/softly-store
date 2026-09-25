type ArtProduct = { name: string; theme: string; coverImage?: string | null; author?: string | null; type?: string | null };
export default function ProductArt({ product, large = false }: { product: ArtProduct; large?: boolean }) {
  const ebook = product.type === "ebook";
  return <div className={`product-art theme-${product.theme || "rose"} ${large ? "large" : ""} ${product.coverImage ? "has-image" : ""} ${ebook ? "is-ebook" : ""}`}>
    {product.coverImage ? <img src={product.coverImage} alt={`${product.name} cover`} /> : <>
      <div className="art-shape" /><div className="art-shape second" />
      <div className="art-cover">
        <span className="art-top">{ebook ? <>e-book<i>.</i></> : <>softly<i>.</i></>}</span>
        <div className="art-center"><span className="art-symbol">{ebook ? "❦" : "✳"}</span><span className="art-title">{product.name}</span><span className="art-rule" />{ebook && product.author && <span className="art-author">{product.author}</span>}</div>
        <span className="art-bottom">{ebook ? <>read online&nbsp; ✦ &nbsp;pdf edition</> : <>a space to become&nbsp; ✦ &nbsp;digital journal</>}</span>
      </div>
    </>}
  </div>;
}
