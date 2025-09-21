import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/StyledText';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getFontSize } from '@/constants/theme';

export default function PrivacyEs() {
  const { fontScale } = useAuthStore();
  const fs = getFontSize(fontScale);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontSize: fs.xl }]}>Política de Privacidad</Text>
        <Text style={[styles.small, { fontSize: fs.sm }]}>Última actualización: 11 de septiembre de 2025</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>1) Quiénes somos</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>MedControl es una aplicación personal para organizar medicamentos, citas y el historial de dosis. Funciona localmente en su dispositivo.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>2) Datos que tratamos</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>
          - Perfil: nombre, tipo de perfil (paciente/cuidador), preferencias (tema, tamaño de fuente).{"\n"}
          - Datos de salud ingresados por usted: lista de medicamentos, dosis, horarios, existencias, historial de dosis, anamnesis y citas (incluyendo imágenes de recetas adjuntas).{"\n"}
          - Identificadores locales: solo claves internas de almacenamiento y programación de notificaciones.
        </Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>3) Dónde y cómo almacenamos</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Todos los datos se guardan exclusivamente en su dispositivo (AsyncStorage y archivos locales). No recopilamos, transmitimos ni vendemos sus datos a terceros. La app no depende de nuestros servidores.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>4) Permisos del dispositivo</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>
          - Notificaciones: para recordatorios de medicación y eventos.{"\n"}
          - Cámara/Galería: para adjuntar imágenes de recetas a las citas.{"\n"}
          Puede conceder o revocar permisos en los ajustes del sistema.
        </Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>5) Finalidades</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Usamos los datos para: (i) mostrar y organizar su información; (ii) programar/gestionar recordatorios; (iii) permitir exportar la anamnesis; (iv) mejorar la usabilidad local (tema, fuente). No usamos los datos con fines de marketing.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>6) Seguridad</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Recomendamos activar protecciones del dispositivo (contraseña, biometría, copia de seguridad cifrada). La app no sube sus datos por defecto. Si comparte PDFs/archivos exportados, hágalo con servicios/personas de confianza.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>7) Retención y eliminación</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Los datos permanecen en su dispositivo mientras la app esté instalada. Puede borrar información en las pantallas del app o desinstalarla para eliminar todo el contenido local.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>8) Menores</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>La app puede ser usada por tutores para gestionar datos de menores. Si es tutor, proporcione sólo la información necesaria y mantenga el dispositivo seguro.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>9) Sus derechos</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>De acuerdo con las leyes aplicables (p. ej., RGPD/LGPD), puede acceder, corregir, eliminar y exportar sus datos. Como se almacenan localmente, ejerce estos derechos directamente en la app.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>10) Cambios</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Podemos actualizar esta política para reflejar mejoras o requisitos legales. Notificaremos cambios relevantes en la app y actualizaremos la fecha de “Última actualización”.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>11) Contacto</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Dudas: soporte@medcontrol.app (ejemplo). Evite enviar datos sensibles por correo.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontWeight: 'bold', marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontWeight: '600', marginTop: spacing.md },
  paragraph: { color: colors.textSecondary, lineHeight: 22 },
  small: { color: colors.textSecondary },
});
