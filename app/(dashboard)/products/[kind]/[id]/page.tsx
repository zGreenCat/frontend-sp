import { ProductDetailView } from "@/presentation/views/ProductDetailView";
import { ProductKind } from "@/domain/entities/Product";

interface PageProps {
  params: Promise<{
    kind: string;
    id: string;
  }>;
}

/**
 * Mapea el slug de la URL al ProductKind del dominio
 */
function mapKindSlugToProductKind(slug: string): ProductKind {
  switch (slug) {
    case 'equipment':
      return 'EQUIPMENT';
    case 'material':
      return 'MATERIAL';
    case 'spare-part':
      return 'SPARE_PART';
    default:
      throw new Error(`Invalid product kind slug: ${slug}`);
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { kind: kindSlug, id } = await params;
  
  try {
    const kind = mapKindSlugToProductKind(kindSlug);
    return <ProductDetailView productId={id} kind={kind} />;
  } catch (error) {
    // Si el kind no es válido, redirigir o mostrar error
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Tipo de producto no válido</h1>
        <p className="text-muted-foreground mt-2">
          El tipo de producto &quot;{kindSlug}&quot; no es válido.
        </p>
      </div>
    );
  }
}
