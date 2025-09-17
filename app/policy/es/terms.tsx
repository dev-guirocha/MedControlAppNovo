import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/StyledText';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getFontSize } from '@/constants/theme';

export default function TermsEs() {
  const { fontScaleMultiplier } = useAuthStore();
  const fs = getFontSize(fontScaleMultiplier);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontSize: fs.xl }]}>Términos de Servicio</Text>
        <Text style={[styles.small, { fontSize: fs.sm }]}>Última actualización: 11 de septiembre de 2025</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>1) Aceptación</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Al usar MedControl (“Servicio”), usted acepta estos Términos. Si no está de acuerdo, por favor no utilice la aplicación.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>2) Elegibilidad</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Debe tener capacidad legal para aceptar estos Términos. Si usa la app en nombre de otra persona (por ejemplo, como cuidador), declara contar con autorización.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>3) Licencia</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Le otorgamos una licencia limitada, revocable y no exclusiva para instalar y usar la app en su dispositivo, solo para fines personales y no comerciales.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>4) Contenido del usuario</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Usted es responsable de la exactitud y del uso compartido de la información ingresada (medicamentos, citas, anamnesis). Usted controla lo que exporta/compartir.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>5) Aviso médico</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>MedControl no es un dispositivo médico ni ofrece diagnóstico o recomendaciones clínicas. Siempre consulte a profesionales de la salud para decisiones clínicas.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>6) Notificaciones</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>La entrega depende de permisos del SO, políticas del dispositivo, conectividad y otros factores externos. No garantizamos puntualidad o disponibilidad continua.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>7) Reglas de uso</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>No use indebidamente el Servicio (por ejemplo: eludir protecciones, uso ilegal, ingeniería inversa más allá de lo permitido legalmente o violar la privacidad de terceros al compartir datos).</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>8) Cambios en el Servicio</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Podemos cambiar, suspender o descontinuar funciones en cualquier momento. Procuraremos preservar la continuidad del uso local y el acceso a sus datos en el dispositivo.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>9) Responsabilidad</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>En la máxima medida permitida por la ley, no seremos responsables por daños indirectos, incidentales, especiales o consecuenciales, ni por pérdidas resultantes del uso incorrecto, problemas del dispositivo, limitaciones del SO, permisos denegados o inexactitudes en los datos ingresados.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>10) Garantías</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>La app se proporciona “tal cual”, sin garantías de comerciabilidad, idoneidad para un propósito específico, disponibilidad o ausencia de errores.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>11) Terminación</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Podemos rescindir el acceso si viola estos Términos. Usted puede dejar de usar la app en cualquier momento desinstalándola y, si lo desea, eliminando los datos locales.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>12) Privacidad</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>El uso del Servicio también se rige por la Política de Privacidad.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>13) Ley aplicable</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Estos Términos se rigen por las leyes de Brasil (ajuste si es necesario). Fuero: su domicilio o São Paulo/SP, salvo disposición legal en contrario.</Text>

        <Text style={[styles.sectionTitle, { fontSize: fs.lg }]}>14) Contacto</Text>
        <Text style={[styles.paragraph, { fontSize: fs.md }]}>Dudas: soporte@medcontrol.app (ejemplo). Evite compartir datos sensibles por correo.</Text>
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

