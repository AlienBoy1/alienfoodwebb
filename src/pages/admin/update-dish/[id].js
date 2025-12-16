import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { connectToDatabase } from "../../../util/mongodb";
import getCategories from "../../../util/getCategories";
import { ObjectId } from "bson";
import NormalToast from "../../../util/Toast/NormalToast";
import Head from "next/head";
import BackButton from "../../../components/BackButton/BackButton";
import Fade from "react-reveal/Fade";

function UpdateDish(props) {
  const [title, setTitle] = useState(props?.dish?.title || "");
  const [description, setDescription] = useState(props?.dish?.description || "");
  const [price, setPrice] = useState(props?.dish?.price || "");
  const [image, setImage] = useState(props?.dish?.image || "");
  const [category, setCategory] = useState(props?.dish?.category || "");
  const router = useRouter();
  const { categories, error } = getCategories(props?.categories);
  const [disabled, setDisabled] = useState(false);

  if (error) {
    console.error(error);
  }

  const formHandler = (e) => {
    e.preventDefault();
    setDisabled(true);
    axios
      .post("/api/admin/update-dish", {
        _id: router.query.id,
        title,
        category,
        description,
        price,
        image,
      })
      .then((res) => {
        NormalToast("Producto actualizado exitosamente");
        setTimeout(() => {
          router.push("/admin/dishes");
        }, 1000);
        setDisabled(false);
      })
      .catch((err) => {
        NormalToast("Algo salió mal", true);
        console.error(err);
        setDisabled(false);
      });
  };

  return (
    <>
      <Head>
        <title>TUNEL DEL TIEMPO | Actualizar Producto</title>
      </Head>
      <div className="heightFixAdmin px-6 lg:py-20 sm:py-16 py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-screen-md sm:text-base text-sm">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
          </div>
          <Fade bottom>
            <div className="mb-6">
              <h2 className="lg:text-4xl sm:text-3xl text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">
                Actualizar Producto
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Modifica la información del producto
              </p>
            </div>
          </Fade>
          <Fade bottom delay={100}>
            <form onSubmit={formHandler} className="flex flex-col gap-5 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  placeholder="Ej: Figura de Acción Spider-Man Marvel Legends"
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-2 px-4 rounded-md outline-none w-full text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-light"
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría *
                </label>
                <select
                  required
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-2 px-4 rounded-md outline-none capitalize w-full text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-light"
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={disabled}
                  value={category}
                >
                  {categories?.map((cat) => (
                    <option value={cat?.name} key={`option-${cat?._id}`}>
                      {cat?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción *
                </label>
                <textarea
                  required
                  placeholder="Descripción del producto (características, detalles, estado, etc.)"
                  className="bg-gray-100 dark:bg-gray-700 py-2 px-4 border border-gray-200 dark:border-gray-600 rounded-md h-32 resize-none outline-none w-full text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-light"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  cols="25"
                  rows="10"
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio (MXN) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-gray-100 dark:bg-gray-700 py-2 border border-gray-200 dark:border-gray-600 px-4 rounded-md outline-none w-full text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-light"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagen del Producto *
                </label>
                {/* Input para subir archivo */}
                <div className="mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Verificar tamaño del archivo (máximo 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          NormalToast("La imagen es demasiado grande. Máximo 5MB", true);
                          e.target.value = "";
                          return;
                        }

                        // Verificar tipo de archivo
                        if (!file.type.startsWith('image/')) {
                          NormalToast("Por favor selecciona un archivo de imagen", true);
                          e.target.value = "";
                          return;
                        }

                        try {
                          // Leer el archivo como base64
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImage(reader.result);
                            NormalToast("Imagen cargada correctamente");
                          };
                          reader.onerror = () => {
                            NormalToast("Error al leer la imagen", true);
                          };
                          reader.readAsDataURL(file);
                        } catch (error) {
                          console.error("Error procesando imagen:", error);
                          NormalToast("Error al procesar la imagen", true);
                        }
                      }
                    }}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-light file:text-white
                      hover:file:bg-primary-dark
                      cursor-pointer"
                    disabled={disabled}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Puedes subir una imagen desde tu dispositivo (máximo 5MB)
                  </p>
                </div>
                {/* Campo de texto como alternativa */}
                <input
                  type="url"
                  placeholder="O ingresa una URL de imagen (https://ejemplo.com/imagen.jpg)"
                  className="bg-gray-100 dark:bg-gray-700 py-2 px-4 border border-gray-200 dark:border-gray-600 rounded-md outline-none w-full text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-light mt-2"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  disabled={disabled}
                />
                {image && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vista previa:</p>
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="max-w-xs h-40 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className={`flex-1 button py-3 px-10 sm:text-base text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={disabled}
                >
                  {disabled ? "Guardando..." : "Actualizar Producto"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/admin/dishes")}
                  className="button-ghost py-3 px-6 sm:text-base text-sm"
                  disabled={disabled}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Fade>
        </div>
      </div>
    </>
  );
}

UpdateDish.admin = true;
export default UpdateDish;

export const getStaticPaths = async () => {
  try {
    const { db } = await connectToDatabase();
    const dishes = await db.collection("dishes").find({}).toArray();
    const paths = dishes.map((dish) => ({
      params: { id: dish._id.toString() },
    }));
    return {
      paths,
      fallback: true,
    };
  } catch (error) {
    console.error("Error connecting to database in getStaticPaths:", error.message);
    return {
      paths: [],
      fallback: true,
    };
  }
};

export const getStaticProps = async (context) => {
  let dish;
  let categories;
  try {
    const { db } = await connectToDatabase();
    dish = await db
      .collection("dishes")
      .findOne({ _id: ObjectId(context.params.id) });
    categories = await db.collection("categories").find({}).toArray();
  } catch (err) {
    console.error(err);
    return {
      notFound: true,
    };
  }
  if (!dish) {
    return {
      notFound: true,
    };
  }
  dish = JSON.parse(JSON.stringify(dish));
  categories = JSON.parse(JSON.stringify(categories));
  return {
    props: {
      dish,
      categories,
    },
    revalidate: 1,
  };
};
