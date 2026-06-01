// La home del gestor es el tablero de expedientes (Kanban).
// /gestor redirige a /gestor/expedientes. La gestión de clientes vive en /gestor/clientes.
export async function getServerSideProps() {
  return { redirect: { destination: '/gestor/expedientes', permanent: false } }
}

export default function GestorHome() {
  return null
}
