import assert from "node:assert/strict";
import { test } from "node:test";
import { jsonLdNegocio, jsonLdProducto, serializarJsonLd } from "./seo.ts";

test("producto: precio en COP y disponibilidad según stock", () => {
  const base = { nombre: "Cargador", descripcion: "20 W", url: "https://t.co/p/c", imagenes: ["https://t.co/i.jpg"], precio: 42000 };
  const en = jsonLdProducto({ ...base, disponibilidad: "en_stock" });
  assert.equal(en.offers.priceCurrency, "COP");
  assert.equal(en.offers.price, 42000);
  assert.equal(en.offers.availability, "https://schema.org/InStock");
  assert.equal(jsonLdProducto({ ...base, disponibilidad: "agotado" }).offers.availability, "https://schema.org/OutOfStock");
});

test("bajo pedido se publica como hecho por encargo", () => {
  const p = jsonLdProducto({ nombre: "X", descripcion: "", url: "u", imagenes: [], precio: 1, disponibilidad: "bajo_pedido" });
  assert.equal(p.offers.availability, "https://schema.org/MadeToOrder");
});

test("producto sin descripción ni imágenes no incluye esos campos", () => {
  const p = jsonLdProducto({ nombre: "X", descripcion: "  ", url: "u", imagenes: [], precio: 1, disponibilidad: "en_stock" });
  assert.equal("description" in p, false);
  assert.equal("image" in p, false);
});

test("negocio local: Ocaña, Norte de Santander y teléfono normalizado", () => {
  const n = jsonLdNegocio("https://t.co", "57 300 123 4567");
  assert.equal(n.address.addressLocality, "Ocaña");
  assert.equal(n.address.addressRegion, "Norte de Santander");
  assert.equal(n.telephone, "+573001234567");
  assert.equal("telephone" in jsonLdNegocio("https://t.co", null), false);
});

test("serializar escapa el cierre de script", () => {
  const s = serializarJsonLd({ nombre: "</script><b>" });
  assert.equal(s.includes("</script>"), false);
  assert.equal(JSON.parse(s).nombre, "</script><b>");
});
