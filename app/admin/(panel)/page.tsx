import { redirect } from "next/navigation";

// El dashboard llega en el Bloque 5; por ahora /admin va directo a Productos.
export default function InicioAdmin() {
  redirect("/admin/productos");
}
