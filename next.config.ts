import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite probar el servidor de desarrollo desde otros dispositivos en la
  // misma red WiFi (ej. celular), evitando el bloqueo por origen cruzado de
  // los recursos de desarrollo (HMR) que Next.js aplica por defecto.
  allowedDevOrigins: ["192.168.100.9"],
};

export default nextConfig;
