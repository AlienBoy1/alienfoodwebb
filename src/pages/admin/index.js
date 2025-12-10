import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";

function Admin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <>
      <Head>
        <title>Alien Food | Panel de Administración</title>
      </Head>
      <div className="heightFixAdmin px-6 flex items-center justify-center">
        <div className="max-w-screen-xs mx-auto lg:text-lg xs:text-base text-sm text-center font-medium text-primary-light">
          Bienvenido al Panel de Administración
          <br />
          Espera mientras redirigimos al Panel de Control
        </div>
      </div>
    </>
  );
}

Admin.admin = true;
export default Admin;
