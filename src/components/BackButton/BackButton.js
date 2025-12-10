import { useRouter } from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/outline";

function BackButton({ label = "Regresar", onClick }) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Si hay historial, regresar, sino ir a home
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-light transition-colors duration-200 font-medium"
    >
      <ArrowLeftIcon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

export default BackButton;

