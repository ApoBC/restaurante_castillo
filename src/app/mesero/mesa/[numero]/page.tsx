import { PedidoBuilder } from '@/components/mesero/PedidoBuilder'

export default async function MesaPedidoPage({
  params,
}: {
  params: Promise<{ numero: string }>
}) {
  const { numero } = await params
  return <PedidoBuilder mesaNumero={Number(numero)} />
}
