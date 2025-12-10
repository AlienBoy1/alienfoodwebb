import Image from "next/image";

function Testimonials() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-screen-xl">
        <h2 className="heading">Nuestros Clientes No Pueden Vivir Sin Nosotros</h2>
        <div className="flex justify-between mt-20 italic lg:text-base  text-sm gap-6 sm:flex-row flex-col">
          <div className="sm:max-w-xs">
          <div className="font-extrabold text-6xl -mb-8">"</div>
            <p>
              "¡Alien Food es simplemente increíble! Acabo de lanzar una startup que me deja
              sin tiempo para cocinar, así que Alien Food es un salvavidas. Ahora que me
              acostumbré a ello, ¡no podría vivir sin mis comidas diarias!
            </p>
            <div className="flex items-center sm:mt-8 mt-4 gap-2">
              <div>
                <Image
                  src="/img/testimonials/customer-1.jpg"
                  alt=""
                  width={45}
                  height={45}
                  objectFit="contain"
                  className="rounded-full"
                />
              </div>

              <span>Alberto Duncan</span>
            </div>
          </div>
          <div className="sm:max-w-xs">
            <div className="font-extrabold text-6xl -mb-8">"</div>
            <p>
              "Comidas económicas, saludables y deliciosas, entregadas directamente a
              mi hogar. Tenemos muchas opciones de entrega de comida aquí en Lisboa, pero nadie
              se acerca siquiera a Alien Food. ¡Mi familia y yo estamos tan enamorados!
            </p>
            <div className="flex items-center sm:mt-8 mt-4 gap-2">
              <div>
                <Image
                  src="/img/testimonials/customer-2.jpg"
                  alt=""
                  width={45}
                  height={45}
                  objectFit="contain"
                  className="rounded-full"
                />
              </div>

              <span>Joana Silva</span>
            </div>
          </div>
          <div className="sm:max-w-xs">
           <div className="font-extrabold text-6xl -mb-8">"</div>
            <p>
              Estaba buscando un servicio de entrega de comida rápido y fácil en San
              Francisco. Probé muchos y terminé con Alien Food. El mejor
              servicio de entrega de comida en el Área de la Bahía. ¡Sigan con el gran trabajo!
            </p>
            <div className="flex items-center sm:mt-8 mt-4 gap-2">
              <div>
                <Image
                  src="/img/testimonials/customer-3.jpg"
                  alt=""
                  width={45}
                  height={45}
                  objectFit="contain"
                  className="rounded-full"
                />
              </div>

              <span>Milton Chapman</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Testimonials;
