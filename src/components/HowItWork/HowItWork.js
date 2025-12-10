import {
  CreditCardIcon,
  CursorClickIcon,
  TruckIcon,
} from "@heroicons/react/solid";

function HowItWork() {
  return (
    <div className="px-6">
      <div className="max-w-screen-xl mx-auto lg:py-20 sm:py-14 py-10">
        <h2 className="heading">Cómo Funciona</h2>
        <div className="mt-20">
          <div className="flex sm:justify-evenly text-center sm:gap-4 gap-8 flex-wrap sm:flex-row flex-col">
            <div className="flex flex-col items-center sm:gap-6 gap-4">
              <CursorClickIcon className="sm:w-14 w-10 text-primary-light mx-auto" />
              <h3 className="font-medium sm:text-2xl text-xl">Elige tu Comida</h3>
              <h4 className="max-w-xs mx-auto sm:text-base text-sm">
                Elige una comida de nuestro variado menú semanal.
              </h4>
            </div>
            <div className="flex flex-col items-center sm:gap-6 gap-4">
              <CreditCardIcon className="sm:w-14 w-10 text-primary-light mx-auto" />
              <h3 className="font-medium sm:text-2xl text-xl">Pago</h3>
              <h4 className="max-w-xs mx-auto  sm:text-base text-sm">
                Completa la dirección, todos los detalles necesarios y realiza el pago.
              </h4>
            </div>
            <div className="flex flex-col items-center sm:gap-6 gap-4">
              <TruckIcon className="sm:w-14 w-10 text-primary-light mx-auto" />
              <h3 className="font-medium sm:text-2xl text-xl">Entrega Rápida</h3>
              <h4 className="mx-auto max-w-xs  sm:text-base text-sm">
                La comida recién preparada llega a tu puerta en una caja
                refrigerada.
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWork;
