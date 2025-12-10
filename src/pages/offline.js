export default function OfflinePage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        Estás sin conexión
      </h1>
      <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
        No pudimos cargar la página porque no hay conexión a internet.
        Intenta recargar cuando vuelvas a estar en línea.
      </p>
    </div>
  );
}

// Generar estáticamente la página para que esté disponible en /offline
export async function getStaticProps() {
  return {
    props: {},
  };
}
