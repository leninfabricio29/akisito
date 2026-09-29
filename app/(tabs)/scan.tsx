import { Redirect } from 'expo-router';

/**
 * El tab central no tiene pantalla propia: la barra abre `/scanner` como modal a pantalla completa.
 * Este archivo solo existe para que el tab aparezca en la barra.
 */
export default function ScanTab() {
  return <Redirect href="/scanner" />;
}
