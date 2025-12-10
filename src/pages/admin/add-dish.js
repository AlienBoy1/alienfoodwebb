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
          
          // Si no hay imágenes cacheadas, obtener imágenes de platillos existentes de esa categoría
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
                console.log(`✅ ${images.length} imágenes encontradas de platillos existentes para categoría: ${category}`);
              }
            } catch (error) {
              console.error("Error obteniendo platillos:", error);
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
        NormalToast("Platillo agregado exitosamente");
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
        <title>Alien Food | Agregar Platillo</title>
      </Head>
      <div className="heightFixAdmin px-3 sm:px-6 lg:py-20 sm:py-16 py-8 sm:py-12">
        <div className="mx-auto max-w-screen-sm sm:text-base  text-sm ">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
          </div>
          <h2 className="lg:text-4xl sm:text-3xl text-2xl  font-bold mb-6">
            Agregar Platillo
          </h2>
          <form onSubmit={formHandler} className="flex flex-col gap-4">
            <input
              type="text"
              required
              value={title}
              placeholder="Título"
              className="bg-gray-100 py-2 px-4 rounded-md outline-none border border-gray-200"
              onChange={(e) => setTitle(e.target.value)}
              disabled={disabled}
            />
            <select
              required
              className="bg-gray-100 py-2 px-4 rounded-md outline-none border border-gray-200 capitalize"
              onChange={(e) => setCategory(e.target.value)}
              disabled={disabled}
            >
              {categories?.map((category) => (
                <option value={category?.name} key={`option-${category?._id}`}>
                  {category?.name}
                </option>
              ))}
            </select>
            <textarea
              required
              placeholder="Descripción"
              className="bg-gray-100 border border-gray-200 py-2 px-4 rounded-md resize-none h-24 outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              cols="25"
              rows="10"
              disabled={disabled}
            ></textarea>
            <input
              type="number"
              required
              placeholder="Precio"
              className="bg-gray-100 border py-2 px-4 rounded-md outline-none border-gray-200"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={disabled}
            />
            
            {/* Selector de imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Imagen
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  O ingresar URL de imagen manualmente
                </label>
                <input
                  type="text"
                  placeholder="URL de Imagen (opcional si seleccionaste una imagen arriba)"
                  className="bg-gray-100 py-2 px-4 border rounded-md outline-none border-gray-200 w-full"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>
            <button
              type="submit"
              className={`button py-2 px-10 sm:text-base text-sm mt-4 ${disabled ? "opacity-50" : ""
                }`}
              disabled={disabled}
            >
              Enviar
            </button>
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
