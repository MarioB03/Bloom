import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { strings } from '@/constants/strings';
import { colors, typography, fonts, spacing, borderRadius } from '@/constants/theme';

const sections = [
  {
    title: '1. Informacion que recopilamos',
    body: `Bloom recopila los siguientes datos cuando usas la aplicacion:

- Correo electronico y nombre para tu cuenta
- Datos de check-in emocional: emociones, intensidad, calidad de sueno, nivel de hambre, fase del ciclo menstrual, eventos y notas
- Registros emocionales detallados (observar y describir)
- Entradas del diario de gratitud
- Plan de seguridad: senales de alerta, estrategias, contactos de confianza y pasos personales
- Historial de practica de habilidades
- Datos del jardin y logros`,
  },
  {
    title: '2. Como usamos tus datos',
    body: `Tus datos se utilizan exclusivamente para:

- Proporcionarte una experiencia personalizada de bienestar emocional
- Mostrarte insights y patrones sobre tu bienestar
- Permitirte compartir datos de forma voluntaria con una persona de confianza

No utilizamos tus datos para publicidad. No vendemos ni compartimos tus datos con terceros. No realizamos analisis de datos agregados con fines comerciales.`,
  },
  {
    title: '3. Almacenamiento y seguridad',
    body: `Tus datos se almacenan de forma segura en Firebase (Google Cloud Platform), con las siguientes medidas de proteccion:

- Los campos sensibles (notas, eventos, gratitud, plan de seguridad) se encriptan con AES antes de almacenarse
- El acceso a Firestore esta protegido por reglas de seguridad que solo permiten acceso al propietario de los datos
- La autenticacion se gestiona a traves de Firebase Authentication
- Las comunicaciones estan protegidas con HTTPS/TLS`,
  },
  {
    title: '4. Compartir datos',
    body: `Bloom incluye una funcion opcional para compartir tus datos de check-in con otra persona:

- Tu generas un codigo de 6 caracteres que expira en 24 horas
- La persona vinculada solo tiene acceso de lectura
- Puedes revocar el acceso en cualquier momento desde tu perfil
- Solo se puede compartir con una persona a la vez`,
  },
  {
    title: '5. Retencion de datos',
    body: `Tus datos se conservan mientras mantengas tu cuenta activa en Bloom. Cuando eliminas tu cuenta, se borran permanentemente:

- Todos los check-ins y registros emocionales
- El diario de gratitud
- El jardin, semillas y logros
- El plan de seguridad
- Los vinculos de compartir
- Tu perfil y cuenta de autenticacion`,
  },
  {
    title: '6. Tus derechos',
    body: `Como usuaria de Bloom, tienes derecho a:

- Acceder a todos tus datos dentro de la aplicacion
- Exportar tus datos en formato PDF (funcion Premium)
- Eliminar tu cuenta y todos los datos asociados de forma permanente
- Revocar el acceso compartido en cualquier momento`,
  },
  {
    title: '7. Contacto',
    body: `Si tienes preguntas sobre esta politica de privacidad o sobre como manejamos tus datos, puedes contactarnos a traves de la App Store o enviando un correo a la direccion proporcionada en la pagina de la aplicacion.

Ultima actualizacion: febrero 2026.`,
  },
];

export default function PoliticaPrivacidadScreen() {
  return (
    <ScreenWrapper>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{strings.privacyPolicy.title}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Sections */}
      {sections.map((section, index) => (
        <Animated.View
          key={index}
          entering={FadeInDown.delay(200 + index * 60).duration(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </Animated.View>
      ))}

      <View style={styles.bottomPadding} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.heading3,
    color: colors.neutral[700],
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  sectionBody: {
    ...typography.body,
    color: colors.neutral[600],
    lineHeight: 22,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
