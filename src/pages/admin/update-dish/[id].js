import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { connectToDatabase } from "../../../util/mongodb";
import getCategories from "../../../util/getCategories";
import { ObjectId } from "bson";
import NormalToast from "../../../util/Toast/NormalToast";
import Head from "next/head";
import BackButton from "../../../components/BackButton/BackButton";

function UpdateDish(props) {
  const [title, setTitle] = useState(props?.dish?.title);
  const [description, setDescription] = useState(props?.dish?.description);
  const [price, setPrice] = useState(props?.dish?.price);
  const [image, setImage] = useState(props?.dish?.image);
  const [category, setCategory] = useState(props?.dish?.category);
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
        NormalToast("Actualizado exitosamente");
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
        <title>Alien Food | Actualizar Platillo</title>
      </Head>
      <div className="heightFixAdmin px-6 lg:py-20 sm:py-16 py-12">
        <div className="mx-auto max-w-screen-sm sm:text-base  text-sm">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
          </div>
          <h2 className="lg:text-4xl sm:text-3xl text-2xl  font-bold mb-6">
            Actualizar Platillo
          </h2>
          <form onSubmit={formHandler} className="flex flex-col gap-4">
            <input
              type="text"
              required
              value={title}
              placeholder="Título"
              className="bg-gray-100 border border-gray-200 py-2 px-4 rounded-md outline-none"
              onChange={(e) => setTitle(e.target.value)}
              disabled={disabled}
            />
            <select
              required
              className="bg-gray-100 border border-gray-200 py-2 px-4 rounded-md outline-none capitalize"
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
              className="bg-gray-100 py-2 px-4  border border-gray-200 rounded-md h-24 resize-none outline-none"
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
              className="bg-gray-100 py-2 border border-gray-200 px-4 rounded-md outline-none"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={disabled}
            />
            <input
              type="text"
              required
              placeholder="URL de Imagen"
              className="bg-gray-100 py-2 px-4 border border-gray-200 rounded-md outline-none"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              disabled={disabled}
            />
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
    // Retornar paths vacío si hay error de conexión durante el build
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
