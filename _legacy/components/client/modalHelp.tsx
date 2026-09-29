import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { HeaderModal } from './headerModal';

type ModalHelpProps = {
	visible: boolean;
	onClose: () => void;
};

type FaqItem = {
	id: string;
	question: string;
	answer: string;
};

const C = {
	brand: '#b82a5e',
	brandLight: '#d4547e',
	brandDark: '#8a1f46',
	brandFaint: 'rgba(184,42,94,0.08)',
	brandBorder: 'rgba(184,42,94,0.18)',
	bg: '#ffffff',
	white: '#ffffff',
	muted: '#9b8492',
	text: '#1a0f15',
	textSub: '#6b5560',
};

const FAQS: FaqItem[] = [
	{
		id: 'faq-1',
		question: 'Como guardo un lugar en favoritos?',
		answer: 'En la ficha del lugar toca el icono de guardar. Luego lo veras en la seccion Guardados de tu perfil.',
	},
	{
		id: 'faq-2',
		question: 'Como dejo una resena?',
		answer: 'Abre un lugar, baja a la seccion de resenas y selecciona la opcion para escribir tu experiencia.',
	},
	{
		id: 'faq-3',
		question: 'Como cambio mi contrasena?',
		answer: 'Ve a Perfil > Configuracion > Cambiar contrasena y sigue los pasos de validacion.',
	},
	{
		id: 'faq-4',
		question: 'Que hago si no se actualiza mi ubicacion?',
		answer: 'Verifica permisos de ubicacion en tu telefono y vuelve a abrir la pantalla de mapa para refrescar.',
	},
];

export default function ModalHelp({ visible, onClose }: ModalHelpProps) {
	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<View style={s.root}>
				<StatusBar barStyle="light-content" />

				<HeaderModal title="Ayuda" subtitle="Descripcion de la app y preguntas frecuentes" onClose={onClose} />

				

				<ScrollView style={s.body} showsVerticalScrollIndicator={false}>
					<View style={s.sectionCard}>
						<View style={s.sectionTitleRow}>
							<Ionicons name="information-circle-outline" size={18} color={C.brand} />
							<Text style={s.sectionTitle}>Sobre la app</Text>
						</View>
						<Text style={s.description}>
							Winner te ayuda a descubrir lugares, guardar tus favoritos, compartir resenas y seguir tu actividad.
							Puedes explorar sitios cercanos, ver recomendaciones y administrar tu perfil en un solo lugar.
						</Text>
					</View>

					<View style={s.faqHeaderRow}>
						<Ionicons name="help-circle-outline" size={18} color={C.brand} />
						<Text style={s.faqHeader}>FAQ</Text>
					</View>

					{FAQS.map((item) => (
						<View key={item.id} style={s.faqCard}>
							<Text style={s.faqQuestion}>{item.question}</Text>
							<Text style={s.faqAnswer}>{item.answer}</Text>
						</View>
					))}

					<View style={{ height: 24 }} />
				</ScrollView>
			</View>
		</Modal>
	);
}

const s = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#f7f2f5',
	},
	body: {
		flex: 1,
		padding: 16,
	},
	sectionCard: {
		backgroundColor: C.white,
		borderWidth: 1,
		borderColor: C.brandBorder,
		borderRadius: 16,
		padding: 14,
		marginBottom: 16,
	},
	sectionTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 8,
	},
	sectionTitle: {
		color: C.text,
		fontSize: 15,
		fontWeight: '800',
	},
	description: {
		color: C.textSub,
		fontSize: 13,
		lineHeight: 20,
	},
	faqHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 10,
	},
	faqHeader: {
		color: C.text,
		fontSize: 16,
		fontWeight: '900',
	},
	faqCard: {
		backgroundColor: C.white,
		borderWidth: 1,
		borderColor: C.brandFaint,
		borderRadius: 14,
		padding: 12,
		marginBottom: 10,
	},
	faqQuestion: {
		color: C.text,
		fontSize: 14,
		fontWeight: '800',
		marginBottom: 5,
	},
	faqAnswer: {
		color: C.textSub,
		fontSize: 12,
		lineHeight: 18,
	},
});
