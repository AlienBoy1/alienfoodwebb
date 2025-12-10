import { signOut, useSession } from "next-auth/client";
import { useRouter } from "next/router";
import onClickOutside from "react-onclickoutside";

function Dropdown({ hideDropDown }) {
  const [session] = useSession();
  const router = useRouter();
  Dropdown.handleClickOutside = hideDropDown;
  return (
    <div className="font-medium w-36 bg-white dark:bg-gray-800 text-sm rounded shadow overflow-hidden border border-gray-100 dark:border-gray-700">
      {session && session?.admin && (
        <div
          className="dropDownOption border-b border-gray-200 dark:border-gray-700"
          onClick={() => router.push("/admin/dashboard")}
        >
          Panel de Control
        </div>
      )}
      <div
        className="dropDownOption border-b border-gray-200 dark:border-gray-700"
        onClick={() => router.push("/profile")}
      >
        Perfil
      </div>
      <div
        className="dropDownOption border-b border-gray-200 dark:border-gray-700"
        onClick={() => router.push("/settings")}
      >
        Configuración
      </div>

      <div
        className="dropDownOption border-b border-gray-200 dark:border-gray-700"
        onClick={() => router.push("/orders")}
      >
        Pedidos
      </div>
      <div
        className="dropDownOption border-b border-gray-200 dark:border-gray-700"
        onClick={() => router.push("/about")}
      >
        Contacto
      </div>
      <div
        className="dropDownOption"
        onClick={() => {
          signOut();
        }}
      >
        Cerrar Sesión
      </div>
    </div>
  );
}

const clickOutsideConfig = {
  handleClickOutside: () => Dropdown.handleClickOutside,
};

export default onClickOutside(Dropdown, clickOutsideConfig);
