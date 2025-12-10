import { useState } from "react";
import { signIn } from "next-auth/client";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import NormalToast from "../util/Toast/NormalToast";

function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username: formData.username,
        password: formData.password,
      });

      if (result?.error) {
        setError("Usuario o contraseña incorrectos");
        NormalToast("Usuario o contraseña incorrectos", true);
      } else {
        NormalToast("Inicio de sesión exitoso");
        router.push("/");
      }
    } catch (err) {
      setError("Error al iniciar sesión");
      NormalToast("Error al iniciar sesión", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Alien Food | Iniciar Sesión</title>
      </Head>
      <div className="heightFix flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-3 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <Image
              src="/img/AlienFood.svg"
              alt="Alien Food"
              width={120}
              height={60}
              objectFit="contain"
              className="mx-auto"
            />
            <h1 className="text-2xl font-semibold mt-4 text-gray-800">
              Iniciar Sesión
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre de Usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder="Ingresa tu nombre de usuario"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full button py-3 text-base font-medium ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{" "}
              <Link href="/register">
                <span className="text-primary-light hover:underline cursor-pointer font-medium">
                  Regístrate aquí
                </span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;

