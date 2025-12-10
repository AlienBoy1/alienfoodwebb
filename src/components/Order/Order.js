import moment from "moment";
import { useSession } from "next-auth/client";
import Link from "next/link";
import Currency from "react-currency-formatter";
import axios from "axios";
import { useState } from "react";
import NormalToast from "../../util/Toast/NormalToast";
import { TrashIcon } from "@heroicons/react/outline";
import { useRouter } from "next/router";
import useSWR from "swr";

function Order({ _id, id, amount_total, timestamp, items, status, admin, onDelete }) {
  const [session, loading] = useSession();
  const [disabled, setDisabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const updateStatus = (e) => {
    setDisabled(true);
    axios
      .post("/api/admin/update-order-status", {
        status: e.target.value,
        _id: _id,
      })
      .then(() => {
        setDisabled(false);
        if (router.pathname.includes("/admin")) {
          // Refrescar la página si estamos en admin
          window.location.reload();
        }
      })
      .catch((err) => {
        console.error(err);
        setDisabled(false);
      });
  };
  const cancelOrder = () => {
    setDisabled(true);
    axios
      .post("/api/cancel-order", { status: "cancelled", _id: _id })
      .then(() => {
        NormalToast("Pedido cancelado");
        setDisabled(false);
      })
      .catch((err) => {
        console.error(err);
        NormalToast("Algo salió mal", true);
        setDisabled(false);
      });
  };

  const deleteOrder = async () => {
    setDisabled(true);
    try {
      await axios.post("/api/admin/delete-order", { _id });
      NormalToast("Pedido eliminado exitosamente");
      setShowDeleteConfirm(false);
      if (onDelete) {
        onDelete(_id);
      } else {
        window.location.reload();
      }
    } catch (err) {
      NormalToast(
        err.response?.data?.message || "Error al eliminar pedido",
        true
      );
      setDisabled(false);
    }
  };

  return (
    <div>
      <div className="w-full space-x-2 flex items-center gap-2">
        {admin ? (
          status && !loading && session && session?.admin ? (
            <select
              className="shadow leading-tight focus:outline-none focus:shadow-outline border xs:text-sm text-xs p-2  bg-blue-500 text-white capitalize border-b-0 rounded-t-md"
              value={status}
              disabled={disabled}
              onChange={updateStatus}
            >
              <option value="shipping soon">Enviando pronto</option>
              <option value="shipped">Enviado</option>
              <option value="out for delivery">En camino</option>
              <option value="delivered">Entregado</option>
            </select>
          ) : (
            <></>
          )
        ) : status ? (
          <div
            className={`border border-b-0 xs:text-sm text-xs px-4 py-2 rounded-t-md  ${status === "cancelled"
                ? "bg-red-500"
                : status !== "delivered"
                  ? "bg-blue-500"
                  : "bg-green-500"
              } text-white inline-block capitalize`}
          >
            {status}
          </div>
        ) : (
          <></>
        )}
        {status && status !== "cancelled" && status !== "delivered" ? (
          <button
            className={`button-red border border-b-0 xs:text-sm text-xs px-4 py-2 rounded-t-md rounded-b-none  inline-block  capitalize ${disabled ? "opacity-50" : ""
              }`}
            onClick={cancelOrder}
            disabled={disabled}
          >
            Cancelar pedido
          </button>
        ) : (
          <></>
        )}
        {admin && session?.admin && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={disabled}
            className={`text-red-600 hover:text-red-800 border border-red-300 hover:bg-red-50 px-3 py-2 rounded-md transition-colors ${disabled ? "opacity-50" : ""
              }`}
            title="Eliminar pedido"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      <Link
        href={`/${admin && session?.admin ? "admin/" : ""}order-details/${_id}`}
      >
        <div
          className={`relative border rounded-md rounded-tl-none cursor-pointer hover:shadow-sm bg-white overflow-hidden ${status && status === "cancelled" ? "opacity-70" : ""
            }`}
          title="Haz clic para ver los detalles del pedido"
        >
          <div className="sm:p-6 p-4 bg-gray-100 sm:text-sm text-xs text-gray-600">
            {status && status === "cancelled" ? (
              <p className="mb-2 text-red-500">
                * El dinero será reembolsado en 24 horas
              </p>
            ) : (
              <></>
            )}
            <p className="sm:absolute sm:top-2 sm:right-2 sm:w-56 lg:w-72 truncate text-xs whitespace-nowrap sm:mb-0 mb-2 font-medium">
              PEDIDO # <span className="text-green-500">{id}</span>
            </p>
            <div className="flex sm:items-center sm:gap-6 gap-1 sm:flex-row flex-col">
              <div className="flex items-center sm:gap-6 gap-4">
                <div>
                  <p className="font-bold text-xs">PEDIDO REALIZADO</p>
                  <p>{moment(timestamp).format("DD MMM YYYY")}</p>
                </div>
                <div>
                  <p className="text-xs font-bold">TOTAL</p>
                  <p className="text-xs font-bold text-red-500">
                    <Currency quantity={amount_total} currency="INR" />
                  </p>
                </div>
              </div>
              <p className="lg:text-xl md:text-lg sm:text-base text-sm font-medium  whitespace-nowrap  self-end flex-1 text-right text-blue-500">
                {items?.length} {items?.length === 1 ? 'artículo' : 'artículos'}
              </p>
            </div>
          </div>
          <div className="sm:p-6 p-4">
            <div className="flex space-x-6 overflow-x-auto py-4 hideScrollBar">
              {items?.map((item) => (
                <img
                  key={`item-img-${item?._id}`}
                  className="h-20 object-contain sm:h-32"
                  src={item?.image}
                  alt=""
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Confirmar Eliminación</h2>
            <p className="mb-4">
              ¿Estás seguro de que deseas eliminar el pedido #{id}?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDisabled(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={disabled}
              >
                Cancelar
              </button>
              <button
                onClick={deleteOrder}
                disabled={disabled}
                className="flex-1 button-red disabled:opacity-50"
              >
                {disabled ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Order;
