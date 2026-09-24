import { Encabezado } from "@/components/tienda/Encabezado";

export default function LayoutTienda({ children }: LayoutProps<"/">) {
  return (
    <>
      <Encabezado />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4">{children}</main>
    </>
  );
}
