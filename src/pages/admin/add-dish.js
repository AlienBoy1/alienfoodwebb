import { useState, useEffect } from "react";
import axios from "axios";
import NormalToast from "../../util/Toast/NormalToast";
import { connectToDatabase } from "../../util/mongodb";
import getCategories from "../../util/getCategories";
import Head from "next/head";
import BackButton from "../../components/BackButton/BackButton";
import Image from "next/image";
import { getCachedImagesByCategory } from "../../util/imageCache";

function AddDish(props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState(props?.categories[0]?.name);
  const { categories, error } = getCategories(props?.categories);
  const [disabled, setDisabled] = useState(false);
  const [cachedImages, setCachedImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  if (error) {
    console.error(error);
  }

  // Cargar imágenes cuando cambia la categoría
  useEffect(() => {
    const loadImages = async () => {
      if (category) {
        setLoadingImages(true);
        try {
          // Primero intentar obtener imágenes cacheadas
          let images = await getCachedImagesByCategory(category);
          
          // Si no hay imágenes cacheadas, obtener imágenes de productos existentes de esa categoría
          if (images.length === 0) {
            try {
              const response = await fetch("/api/dishes");
              if (response.ok) {
                const dishes = await response.json();
                const categoryDishes = dishes.filter(
                  (dish) => dish.category === category || (dish.category?.name === category)
                );
                images = categoryDishes
                  .filter((dish) => dish.image)
                  .map((dish, index) => ({
                    id: `dish-${dish._id || index}`,
                    url: dish.image,
                    dataUrl: null,
                  }));
                console.log(`✅ ${images.length} imágenes encontradas de productos existentes para categoría: ${category}`);
              }
            } catch (error) {
              console.error("Error obteniendo productos:", error);
            }
          } else {
            console.log(`✅ ${images.length} imágenes cacheadas cargadas para categoría: ${category}`);
          }
          
          setCachedImages(images);
        } catch (error) {
          console.error("Error cargando imágenes:", error);
          setCachedImages([]);
        } finally {
          setLoadingImages(false);
        }
      } else {
        setCachedImages([]);
      }
    };

    loadImages();
  }, [category]);

  const formHandler = (e) => {
    e.preventDefault();
    setDisabled(true);
    axios
      .post("/api/admin/add-dish", {
        title,
        category,
        description,
        price,
        image,
      })
      .then((res) => {
        NormalToast("Producto agregado exitosamente");
        setTitle("");
        setDescription("");
        setPrice("");
        setImage("");
        setCategory("");
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
        <title>TUNEL DEL TIEMPO | Agregar Producto</title>
      </Head>
      <div className="heightFixAdmin px-3 sm:px-6 lg:py-20 sm:py-16 py-8 sm:py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-screen-md sm:text-base text-sm">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
          </div>
          <div className="mb-6">
            <h2 className="lg:text-4xl sm:text-3xl text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">
              Agregar Nuevo Producto
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Completa la información del producto para agregarlo al catálogo
            </p>
          </div>
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
                className="bg-gray-100 dark:bg-gray-700 py-2 px-4 rounded-md outline-none border border-gray-200 dark:border-gray-600 w-full text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-light"
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
                className="bg-gray-100 dark:bg-gray-700 py-2 px-4 rounded-md outline-none border border-gray-200 dark:border-gray-600 capitalize w-full text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-light"
                onChange={(e) => setCategory(e.target.value)}
                disabled={disabled}
                value={category}
              >
              {categories?.map((category) => (
                <option value={category?.name} key={`option-${category?._id}`}>
                  {category?.name}
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
                className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-2 px-4 rounded-md resize-none h-32 outline-none w-full text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-light"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                cols="25"
                rows="10"
                disabled={disabled}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Precio (MXN)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="bg-gray-100 dark:bg-gray-700 border py-2 px-4 rounded-md outline-none border-gray-200 dark:border-gray-600 w-full text-gray-800 dark:text-gray-200"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={disabled}
              />
            </div>
            
            {/* Selector de imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Imagen del Producto
              </label>
              {/* Input para subir archivo con permisos */}
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
              {loadingImages ? (
                <div className="text-center py-4 text-gray-500">
                  Cargando imágenes...
                </div>
              ) : cachedImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-md bg-gray-50">
                  {cachedImages.map((img) => (
                    <div
                      key={img.id || img.url}
                      onClick={() => {
                        // Usar dataUrl si está disponible (offline), sino usar URL
                        setImage(img.dataUrl || img.url);
                      }}
                      className={`cursor-pointer border-2 rounded-md overflow-hidden transition-all ${
                        image === (img.dataUrl || img.url)
                          ? "border-primary-light ring-2 ring-primary-light"
                          : "border-gray-300 hover:border-primary-light"
                      }`}
                    >
                      <img
                        src={img.dataUrl || img.url}
                        alt=""
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          // Si falla la imagen cacheada, intentar con la URL original
                          if (img.dataUrl && img.url !== img.dataUrl) {
                            e.target.src = img.url;
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-md bg-gray-50">
                  <p className="text-sm">
                    No hay imágenes disponibles para esta categoría.
                  </p>
                  <p className="text-xs mt-1">
                    Las imágenes se cargarán automáticamente cuando estés online.
                  </p>
                </div>
              )}
              
              {/* Campo de texto como alternativa */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  O ingresar URL de imagen manualmente
                </label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="bg-gray-100 dark:bg-gray-700 py-2 px-4 border rounded-md outline-none border-gray-200 dark:border-gray-600 w-full text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-light"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  disabled={disabled}
                />
                {image && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vista previa:</p>
                    <img 
                      src={image} 
                      alt="Preview" 
                      className="max-w-xs h-32 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className={`flex-1 button py-3 px-10 sm:text-base text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={disabled}
              >
                {disabled ? "Guardando..." : "Agregar Producto"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setPrice("");
                  setImage("");
                  setCategory(props?.categories[0]?.name || "");
                }}
                className="button-ghost py-3 px-6 sm:text-base text-sm"
                disabled={disabled}
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

AddDish.admin = true;
export default AddDish;

export const getStaticProps = async () => {
  try {
    const { db } = await connectToDatabase();
    let categories = await db.collection("categories").find({}).toArray();
    categories = JSON.parse(JSON.stringify(categories));
    return {
      props: {
        categories,
      },
      revalidate: 1,
    };
  } catch (error) {
    console.error("Error connecting to database:", error.message);
    // Retornar array vacío si hay error de conexión durante el build
    return {
      props: {
        categories: [],
      },
      revalidate: 1,
    };
  }
};
