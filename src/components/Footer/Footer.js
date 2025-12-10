import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { HeartIcon } from "@heroicons/react/solid";

function Footer({ admin }) {
  const router = useRouter();
  const gmailHandler = () => {
    window.open(
      "mailto:" +
      "piyushsati311999@gmail.com" +
      "?subject=" +
      " " +
      "&body=" +
      " ",
      "_self"
    );
  };
  return (
    <div className="bg-gray-800 dark:bg-gray-900 py-8 px-6 text-gray-200 dark:text-gray-300 lg:text-base text-sm">
      <div className="max-w-screen-xl w-full mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center lg:space-x-8 space-x-4">
            <Link href="/">
              <span className="cursor-pointer hover:text-white">Inicio</span>
            </Link>
            {!admin ? (
              <Link href="/orders">
                <span className="cursor-pointer hover:text-white">Pedidos</span>
              </Link>
            ) : (
              <></>
            )}
          </div>
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="md:w-6 w-5  my-auto">
              <Image
                width={25}
                height={25}
                src="/img/social/email.svg"
                objectFit="contain"
                className="cursor-pointer"
                alt="email"
                onClick={gmailHandler}
              />
            </div>
            <div className="md:w-6 w-5  my-auto">
              <Image
                width={25}
                height={25}
                src="/img/social/linkedin.svg"
                objectFit="contain"
                className="cursor-pointer"
                alt="linkedin"
                onClick={() => {
                  router.push("https://www.linkedin.com/in/piyush-sati");
                }}
              />
            </div>
            <div className="md:w-6 w-5 my-auto">
              <Image
                width={25}
                height={25}
                src="/img/social/github.svg"
                objectFit="contain"
                className="cursor-pointer"
                alt="github"
                  // GitHub link removed per project copy requirements
                  onClick={() => {}}
              />
            </div>
          </div>
        </div>
        <p className="mt-6 text-gray-200 text-center">
          © {new Date().getFullYear()} Alien Food. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

export default Footer;
