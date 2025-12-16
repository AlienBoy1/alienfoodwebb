import { useState } from "react";
import axios from "axios";
import NormalToast from "../../util/Toast/NormalToast";
import Head from "next/head";
import BackButton from "../../components/BackButton/BackButton";

function AddCategory() {
  const [categoryName, setCategoryName] = useState("");
  const [disabled, setDisabled] = useState(false);

  const formHandler = (e) => {
    setDisabled(true);
    e.preventDefault();
    axios
      .post("/api/admin/add-category", { name: categoryName })
      .then(() => {
        NormalToast("Categoría agregada exitosamente");
        setCategoryName("");
        setDisabled(false);
      })
      .catch((err) => {
        console.error(err);
        NormalToast("Algo salió mal", true);
        setDisabled(false);
      });
  };

  return (
    <>
      <Head>
        <title>TUNEL DEL TIEMPO | Agregar Categoría</title>
      </Head>
      <div className="heightFixAdmin px-6 lg:py-28 py-24">
        <div className="mx-auto max-w-screen-sm sm:text-base  text-sm">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
          </div>
          <h2 className="lg:text-4xl sm:text-3xl text-2xl font-bold mb-6">
            Agregar Categoría
          </h2>
          <form onSubmit={formHandler} className="flex flex-col gap-6">
            <input
              type="text"
              placeholder="Ingresa el nombre de la categoría"
              className="bg-gray-100 py-2 border border-gray-200  px-4 rounded-md outline-none"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={disabled}
            />
            <button
              className={`button pt-2 px-10 sm:text-base text-sm ${disabled ? "opacity-50" : ""
                }`}
              type="submit"
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

AddCategory.admin = true;
export default AddCategory;
