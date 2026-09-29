import { Redirect } from 'expo-router';

/** El tab central abre `/business/validate` como modal; este archivo solo reserva el lugar en la barra. */
export default function ValidateTab() {
  return <Redirect href="/business/validate" />;
}
